/**
 * Query OpenStreetMap Overpass API for landmarks near each MRT exit.
 * Generates src/data/exitLandmarks.json with { [stationCode]: { [exitName]: [...] } }
 *
 * Usage: node scripts/fetchExitLandmarks.js
 * Runtime: ~2-3 minutes (1 req/s over ~130 stations)
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const GEOJSON_PATH = resolve(ROOT, 'src/data/sg-rail.geo.json')
const OUTPUT_PATH = resolve(ROOT, 'src/data/exitLandmarks.json')

// POI tags we care about (with human-readable category)
const TAG_FILTER = '^(amenity|shop|tourism|leisure|historic|office)$'

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'
const DELAY_MS = 2000 // 2s between requests (avoid rate limiting)
const MAX_RETRIES = 2
const RADIUS_M = 200 // search radius around station center

function loadExits() {
    const raw = readFileSync(GEOJSON_PATH, 'utf-8')
    const data = JSON.parse(raw)
    const exits = data.features.filter(
        f => f.properties.stop_type === 'entrance'
    )
    // Group by station
    const byStation = {}
    exits.forEach(e => {
        const code = e.properties.station_codes
        if (!byStation[code]) byStation[code] = []
        byStation[code].push({
            name: e.properties.name,
            lng: e.geometry.coordinates[0],
            lat: e.geometry.coordinates[1],
        })
    })
    // Deduplicate exits by name within each station
    Object.keys(byStation).forEach(code => {
        const seen = new Set()
        byStation[code] = byStation[code].filter(e => {
            if (seen.has(e.name)) return false
            seen.add(e.name)
            return true
        })
    })
    return byStation
}

function haversine(a, b) {
    const R = 6371
    const dLat = (b.lat - a.lat) * Math.PI / 180
    const dLng = (b.lng - a.lng) * Math.PI / 180
    const lat1 = a.lat * Math.PI / 180
    const lat2 = b.lat * Math.PI / 180
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

function overpassQuery(lat, lng) {
    return `
[out:json][timeout:25];
(
  node(around:${RADIUS_M},${lat},${lng})[name][~"${TAG_FILTER}"~"."];
  way(around:${RADIUS_M},${lat},${lng})[name][~"${TAG_FILTER}"~"."];
);
out center;
`.trim()
}

async function fetchPOIs(lat, lng) {
    const body = overpassQuery(lat, lng)
    let lastErr = null
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        if (attempt > 0) await sleep(5000) // backoff before retry
        try {
            const resp = await fetch(OVERPASS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                    'Accept': 'application/json',
                    'User-Agent': 'MRT-Visualization/1.0',
                },
                body,
            })
            if (!resp.ok) { lastErr = new Error(`HTTP ${resp.status}`); continue }
            const data = await resp.json()
            // process and return data
            const pois = []
            data.elements.forEach(el => {
                const elLat = el.lat ?? el.center?.lat
                const elLng = el.lon ?? el.center?.lon
                if (elLat == null || elLng == null) return
                const tags = el.tags || {}
                let category = 'other'
                if (tags.amenity) category = tags.amenity
                else if (tags.shop) category = tags.shop
                else if (tags.tourism) category = tags.tourism
                else if (tags.leisure) category = tags.leisure
                else if (tags.historic) category = tags.historic
                else if (tags.office) category = tags.office
                pois.push({ name: tags.name, category, lng: elLng, lat: elLat })
            })
            const seen = new Set()
            return pois.filter(p => {
                const key = p.name.toLowerCase()
                if (seen.has(key)) return false
                seen.add(key)
                return true
            })
        } catch (e) { lastErr = e }
    }
    throw lastErr || new Error('Unknown error')
}

function matchPoisToExits(pois, exits) {
    const result = {}
    exits.forEach(e => { result[e.name] = [] })
    pois.forEach(poi => {
        let bestExit = null
        let bestDist = Infinity
        exits.forEach(e => {
            const d = haversine(e, poi)
            if (d < bestDist) { bestDist = d; bestExit = e }
        })
        if (bestExit && bestDist < RADIUS_M / 1000) { // within our search radius in km
            result[bestExit.name].push({
                name: poi.name,
                category: poi.category,
                dist: Math.round(bestDist * 1000), // meters
            })
        }
    })
    // Sort each exit's POIs by distance, keep top 8
    Object.keys(result).forEach(key => {
        result[key].sort((a, b) => a.dist - b.dist)
        if (result[key].length > 8) result[key] = result[key].slice(0, 8)
    })
    return result
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
    const exitsByStation = loadExits()
    const stations = Object.keys(exitsByStation)
    console.log(`Found ${stations.length} stations with exits (${stations.reduce((s, c) => s + exitsByStation[c].length, 0)} total exits)`)

    const output = {}
    let done = 0
    let failed = 0

    for (const stationCode of stations) {
        const exits = exitsByStation[stationCode]
        // Use station center (average of exit coords) as search center
        const centerLat = exits.reduce((s, e) => s + e.lat, 0) / exits.length
        const centerLng = exits.reduce((s, e) => s + e.lng, 0) / exits.length

        const label = `${stationCode} (${exits.length} exits)`
        process.stdout.write(`[${done + 1}/${stations.length}] ${label} ... `)

        try {
            const pois = await fetchPOIs(centerLat, centerLng)
            const matched = matchPoisToExits(pois, exits)
            // Only include exits that have landmarks
            const filtered = {}
            Object.entries(matched).forEach(([exit, landmarks]) => {
                if (landmarks.length > 0) filtered[exit] = landmarks
            })
            if (Object.keys(filtered).length > 0) {
                output[stationCode] = filtered
            }
            console.log(`${pois.length} POIs → ${Object.values(filtered).reduce((s, l) => s + l.length, 0)} matched`)
            done++
        } catch (err) {
            console.log(`FAILED: ${err.message}`)
            failed++
        }

        await sleep(DELAY_MS)
    }

    console.log(`\nDone. ${done} stations processed, ${failed} failed.`)
    console.log(`${Object.keys(output).length} stations have exit landmarks.`)

    // Add human-readable category labels
    const annotated = {}
    Object.entries(output).forEach(([station, exits]) => {
        annotated[station] = {}
        Object.entries(exits).forEach(([exitName, landmarks]) => {
            annotated[station][exitName] = landmarks.map(l => ({
                ...l,
                label: formatCategory(l.category),
            }))
        })
    })

    writeFileSync(OUTPUT_PATH, JSON.stringify(annotated, null, 2), 'utf-8')
    console.log(`Written to ${OUTPUT_PATH}`)
}

function formatCategory(cat) {
    const map = {
        school: 'School', university: 'University', college: 'College',
        hospital: 'Hospital', clinic: 'Clinic', pharmacy: 'Pharmacy',
        library: 'Library', place_of_worship: 'Place of Worship',
        restaurant: 'Restaurant', cafe: 'Cafe', fast_food: 'Fast Food',
        supermarket: 'Supermarket', mall: 'Shopping Mall',
        department_store: 'Department Store', convenience: 'Convenience Store',
        hotel: 'Hotel', hostel: 'Hostel',
        museum: 'Museum', attraction: 'Attraction', gallery: 'Gallery',
        park: 'Park', sports_centre: 'Sports Centre',
        bank: 'Bank', atm: 'ATM', post_office: 'Post Office',
        police: 'Police Station', fire_station: 'Fire Station',
        theatre: 'Theatre', cinema: 'Cinema',
        government: 'Government Office',
    }
    return map[cat] || cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

main()
