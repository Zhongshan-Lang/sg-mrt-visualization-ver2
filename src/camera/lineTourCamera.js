import * as turf from '@turf/turf'
import { lineCameraPresets } from '../config'
import { stationCodeToCoordinates } from '../data/generated/stationIndex'
import { generatedLineSequences } from '../data/generated/lineIndex'
import { lrtLineHubs } from '../routing/specialLineRules'

const OVERVIEW_HOLD_MS = 8000
const OVERVIEW_DURATION_MS = 1800
const START_FOCUS_DURATION_MS = 1400
const MIN_CRUISE_DURATION_MS = 11000
const MAX_CRUISE_DURATION_MS = 22000
const BEARING_SMOOTHING = 0.105
const MAX_BEARING_STEP = 0.95
const BEARING_SAMPLE_LOOKAHEAD = 6
const LINE_OVERVIEW_ZOOM_BOOST = 0.38
const LINE_PANEL_SAFE_PADDING = {
    desktop: { top: 28, bottom: 32, left: 374, right: 24 },
    mobile: { top: 72, bottom: 74, left: 18, right: 18 }
}

let activeTour = null

export function startLineTourCamera(mapRef, lineCode, lineFeature) {
    const map = mapRef?.current
    const preset = lineCameraPresets[lineCode]
    if (!map || !preset || !lineFeature) return

    stopLineTourCamera()

    const fullLineFeature = lineFeature
    const terminalLine = getTerminalStationLine(lineCode)
    const tourLine = getLineGeometryForTour(fullLineFeature, terminalLine, lineCode) || terminalLine || getPrimaryLineString(fullLineFeature)
    if (!tourLine) {
        flyToLineOverview(map, preset, terminalLine || fullLineFeature)
        return
    }

    activeTour = {
        map,
        timers: [],
        frame: null,
        cleanupUserCancel: addUserCancelListeners(map)
    }

    flyToLineOverview(map, preset, terminalLine || tourLine)
    schedule(activeTour, OVERVIEW_DURATION_MS + OVERVIEW_HOLD_MS, () => runLineCruise(map, preset, tourLine))
}

export function stopLineTourCamera({ stopMapAnimation = false } = {}) {
    if (!activeTour) return

    activeTour.timers.forEach(timer => clearTimeout(timer))
    if (activeTour.frame) {
        cancelAnimationFrame(activeTour.frame)
    }
    activeTour.cleanupUserCancel?.()

    if (stopMapAnimation) {
        activeTour.map?.stop?.()
    }

    activeTour = null
}

function runLineCruise(map, preset, lineFeature) {
    if (!activeTour || activeTour.map !== map) return

    const cruiseLine = smoothLine(lineFeature)
    const coords = cruiseLine.geometry.coordinates
    const start = coords[0]
    const lineLength = turf.length(cruiseLine, { units: 'kilometers' })
    const cruiseDuration = clamp(lineLength * 900, MIN_CRUISE_DURATION_MS, MAX_CRUISE_DURATION_MS)
    const cruiseZoom = clamp((preset.zoom ?? map.getZoom()) + 1.05, preset.zoom ?? 12, 15.7)
    const cruisePitch = clamp((preset.pitch ?? 45) + 4, 34, 62)
    const cameraSamples = buildCameraSamples(cruiseLine, preset.bearing)
    const cruiseBearing = cameraSamples[0]?.bearing ?? preset.bearing

    map.easeTo({
        center: start,
        zoom: cruiseZoom,
        pitch: cruisePitch,
        bearing: cruiseBearing,
        duration: START_FOCUS_DURATION_MS,
        essential: true,
        easing: easeOutCubic
    })

    schedule(activeTour, START_FOCUS_DURATION_MS + 120, () => {
        if (!activeTour || activeTour.map !== map) return
        animateCameraAlongLine(map, cruiseLine, {
            zoom: cruiseZoom,
            pitch: cruisePitch,
            bearing: cruiseBearing,
            duration: cruiseDuration,
            samples: cameraSamples
        })
    })

    schedule(activeTour, START_FOCUS_DURATION_MS + cruiseDuration + 420, () => {
        if (!activeTour || activeTour.map !== map) return
        flyToLineOverview(map, preset, lineFeature)
        schedule(activeTour, OVERVIEW_DURATION_MS + OVERVIEW_HOLD_MS, () => runLineCruise(map, preset, lineFeature))
    })
}

function animateCameraAlongLine(map, lineFeature, camera) {
    const tour = activeTour
    const samples = camera.samples || buildCameraSamples(lineFeature, camera.bearing)
    const startedAt = performance.now()

    const frame = (now) => {
        if (!activeTour || activeTour !== tour || activeTour.map !== map) return

        const elapsed = now - startedAt
        const progress = clamp(elapsed / camera.duration, 0, 1)
        const eased = easeInOutSine(progress)
        const cameraState = interpolateCameraSample(samples, eased)

        map.jumpTo({
            center: cameraState.center,
            zoom: camera.zoom,
            pitch: camera.pitch,
            bearing: cameraState.bearing
        })

        if (progress < 1) {
            activeTour.frame = requestAnimationFrame(frame)
        } else {
            activeTour.frame = null
        }
    }

    activeTour.frame = requestAnimationFrame(frame)
}

function buildCameraSamples(lineFeature, fallbackBearing) {
    const coords = lineFeature.geometry?.coordinates || []
    if (coords.length < 2) {
        return [{ center: coords[0] || [0, 0], bearing: fallbackBearing }]
    }

    const rawSamples = coords.map((coord, index) => {
        const next = coords[Math.min(coords.length - 1, index + BEARING_SAMPLE_LOOKAHEAD)]
        const prev = coords[Math.max(0, index - BEARING_SAMPLE_LOOKAHEAD)]
        const bearing = index < coords.length - 1
            ? turf.bearing(turf.point(coord), turf.point(next))
            : turf.bearing(turf.point(prev), turf.point(coord))
        return {
            center: coord,
            bearing: Number.isFinite(bearing) ? bearing : fallbackBearing
        }
    })

    let currentBearing = rawSamples[0].bearing
    return rawSamples.map(sample => {
        const step = shortestBearingDelta(currentBearing, sample.bearing) * BEARING_SMOOTHING
        currentBearing += clamp(step, -MAX_BEARING_STEP, MAX_BEARING_STEP)
        return {
            center: sample.center,
            bearing: currentBearing
        }
    })
}

function interpolateCameraSample(samples, progress) {
    if (samples.length === 1) return samples[0]

    const scaled = progress * (samples.length - 1)
    const index = Math.floor(scaled)
    const nextIndex = Math.min(samples.length - 1, index + 1)
    const t = scaled - index
    const current = samples[index]
    const next = samples[nextIndex]
    const bearing = current.bearing + shortestBearingDelta(current.bearing, next.bearing) * t

    return {
        center: [
            current.center[0] + (next.center[0] - current.center[0]) * t,
            current.center[1] + (next.center[1] - current.center[1]) * t
        ],
        bearing
    }
}

function smoothLine(lineFeature) {
    const fitted = fitRegularCruiseCurve(lineFeature)
    return fitted || lineFeature
}

function fitRegularCruiseCurve(lineFeature) {
    const length = turf.length(lineFeature, { units: 'kilometers' })
    if (!Number.isFinite(length) || length <= 0.05) return null

    const anchors = getTrendCurveAnchors(lineFeature, length)
    if (anchors.length < 3) return null

    const fittedCoords = smoothTrendAnchors(anchors)
    return {
        type: 'Feature',
        properties: {
            ...(lineFeature.properties || {}),
            cameraCurve: 'regular-fit'
        },
        geometry: {
            type: 'LineString',
            coordinates: fittedCoords
        }
    }
}

function getTrendCurveAnchors(lineFeature, length) {
    const coords = lineFeature.geometry?.coordinates || []
    if (coords.length < 2) return []

    const anchorCount = clamp(Math.round(length / 3) + 5, 8, 18)
    const segmentLength = length / (anchorCount - 1)
    const windowLength = segmentLength * 1.15
    const anchors = []

    for (let i = 0; i < anchorCount; i += 1) {
        if (i === 0) {
            anchors.push(coords[0])
            continue
        }
        if (i === anchorCount - 1) {
            anchors.push(coords[coords.length - 1])
            continue
        }

        const centerDistance = length * (i / (anchorCount - 1))
        anchors.push(getAveragePointAroundDistance(lineFeature, centerDistance, windowLength, length))
    }

    return anchors
}

function getAveragePointAroundDistance(lineFeature, centerDistance, windowLength, lineLength) {
    const sampleCount = 11
    const startDistance = clamp(centerDistance - windowLength / 2, 0, lineLength)
    const endDistance = clamp(centerDistance + windowLength / 2, 0, lineLength)
    let lng = 0
    let lat = 0

    for (let i = 0; i < sampleCount; i += 1) {
        const t = sampleCount === 1 ? 0.5 : i / (sampleCount - 1)
        const distance = startDistance + (endDistance - startDistance) * t
        const coord = turf.along(lineFeature, distance, { units: 'kilometers' }).geometry.coordinates
        lng += coord[0]
        lat += coord[1]
    }

    return [lng / sampleCount, lat / sampleCount]
}

function smoothTrendAnchors(anchors) {
    const smoothed = chaikinSmooth(anchors, 5)
    const line = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: smoothed
        }
    }
    return resampleLine(line, 260)
}

function chaikinSmooth(points, iterations) {
    let result = [...points]

    for (let iteration = 0; iteration < iterations; iteration += 1) {
        const next = [result[0]]
        for (let i = 0; i < result.length - 1; i += 1) {
            const current = result[i]
            const following = result[i + 1]
            next.push([
                current[0] * 0.75 + following[0] * 0.25,
                current[1] * 0.75 + following[1] * 0.25
            ])
            next.push([
                current[0] * 0.25 + following[0] * 0.75,
                current[1] * 0.25 + following[1] * 0.75
            ])
        }
        next.push(result[result.length - 1])
        result = next
    }

    return result
}

function resampleLine(lineFeature, pointCount) {
    const length = turf.length(lineFeature, { units: 'kilometers' })
    if (!Number.isFinite(length) || length <= 0.05) return lineFeature.geometry.coordinates

    const coords = []
    for (let i = 0; i < pointCount; i += 1) {
        const distance = length * (i / (pointCount - 1))
        coords.push(turf.along(lineFeature, distance, { units: 'kilometers' }).geometry.coordinates)
    }
    return coords
}

function flyToLineOverview(map, preset, lineFeature) {
    if (fitLineOverview(map, preset, lineFeature)) return

    map.easeTo({
        center: preset.center,
        zoom: preset.zoom,
        pitch: preset.pitch,
        bearing: preset.bearing,
        duration: OVERVIEW_DURATION_MS,
        essential: true,
        easing: easeOutCubic
    })
}

function fitLineOverview(map, preset, lineFeature) {
    const bounds = getCoordinateBounds(lineFeature?.geometry?.coordinates)
    if (!bounds) return false

    const options = {
        padding: getLineOverviewPadding(map),
        pitch: preset.pitch,
        bearing: preset.bearing,
        maxZoom: Math.max(preset.zoom ?? 12, 15.25)
    }
    const camera = map.cameraForBounds?.(bounds, options)
    if (camera?.center && Number.isFinite(camera.zoom)) {
        map.easeTo({
            center: camera.center,
            zoom: Math.min(camera.zoom + LINE_OVERVIEW_ZOOM_BOOST, options.maxZoom),
            pitch: preset.pitch,
            bearing: preset.bearing,
            duration: OVERVIEW_DURATION_MS,
            essential: true,
            easing: easeOutCubic
        })
        return true
    }

    map.fitBounds(bounds, {
        ...options,
        duration: OVERVIEW_DURATION_MS,
        essential: true,
        easing: easeOutCubic
    })
    return true
}

function getLineOverviewPadding(map) {
    const canvas = map.getCanvas?.()
    const width = canvas?.clientWidth || window.innerWidth || 1200
    return width <= 760 ? LINE_PANEL_SAFE_PADDING.mobile : LINE_PANEL_SAFE_PADDING.desktop
}

function getCoordinateBounds(coordinates) {
    const flatCoords = flattenCoordinates(coordinates)
        .filter(coord => Array.isArray(coord) && Number.isFinite(coord[0]) && Number.isFinite(coord[1]))
    if (flatCoords.length === 0) return null

    let minLng = flatCoords[0][0]
    let minLat = flatCoords[0][1]
    let maxLng = flatCoords[0][0]
    let maxLat = flatCoords[0][1]

    flatCoords.forEach(([lng, lat]) => {
        minLng = Math.min(minLng, lng)
        minLat = Math.min(minLat, lat)
        maxLng = Math.max(maxLng, lng)
        maxLat = Math.max(maxLat, lat)
    })

    if (minLng === maxLng && minLat === maxLat) return null
    return [[minLng, minLat], [maxLng, maxLat]]
}

function flattenCoordinates(coordinates) {
    if (!Array.isArray(coordinates)) return []
    if (typeof coordinates[0] === 'number') return [coordinates]
    return coordinates.flatMap(flattenCoordinates)
}

function getPrimaryLineString(feature) {
    if (feature.geometry?.type === 'LineString') {
        return feature.geometry.coordinates.length > 1 ? feature : null
    }

    if (feature.geometry?.type !== 'MultiLineString') return null

    let longest = null
    let longestLength = 0
    feature.geometry.coordinates.forEach(coords => {
        if (!Array.isArray(coords) || coords.length < 2) return
        const line = { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }
        const length = turf.length(line, { units: 'kilometers' })
        if (length > longestLength) {
            longest = line
            longestLength = length
        }
    })
    return longest
}

function getLineGeometryForTour(lineFeature, terminalLine, lineCode) {
    const candidates = getLineStringCandidates(lineFeature)
    if (candidates.length === 0) return null

    const baseLine = lrtLineHubs[lineCode]
        ? stitchLineStringCandidates(candidates)
        : getPrimaryLineString(lineFeature)

    return enforceTerminalEndpoints(orientLineToTerminalStart(baseLine, terminalLine), terminalLine)
}

function enforceTerminalEndpoints(lineFeature, terminalLine) {
    const terminalCoords = terminalLine?.geometry?.coordinates || []
    const coords = lineFeature?.geometry?.coordinates || []
    if (terminalCoords.length < 2 || coords.length < 2) return lineFeature

    return {
        ...lineFeature,
        geometry: {
            ...lineFeature.geometry,
            coordinates: [
                terminalCoords[0],
                ...coords.slice(1, -1),
                terminalCoords[terminalCoords.length - 1]
            ]
        }
    }
}

function orientLineToTerminalStart(lineFeature, terminalLine) {
    const terminalCoords = terminalLine?.geometry?.coordinates || []
    const coords = lineFeature?.geometry?.coordinates || []
    if (terminalCoords.length < 2 || coords.length < 2) return lineFeature

    const terminalStart = turf.point(terminalCoords[0])
    const terminalEnd = turf.point(terminalCoords[terminalCoords.length - 1])
    const lineStart = turf.point(coords[0])
    const lineEnd = turf.point(coords[coords.length - 1])
    const forwardScore =
        turf.distance(terminalStart, lineStart, { units: 'kilometers' }) +
        turf.distance(terminalEnd, lineEnd, { units: 'kilometers' })
    const reverseScore =
        turf.distance(terminalStart, lineEnd, { units: 'kilometers' }) +
        turf.distance(terminalEnd, lineStart, { units: 'kilometers' })

    if (reverseScore >= forwardScore) return lineFeature

    return {
        ...lineFeature,
        geometry: {
            ...lineFeature.geometry,
            coordinates: [...coords].reverse()
        }
    }
}

function stitchLineStringCandidates(candidates) {
    if (candidates.length === 1) return candidates[0]

    const remaining = candidates.map(candidate => [...candidate.geometry.coordinates])
    let stitched = remaining.shift()

    while (remaining.length > 0) {
        const tail = stitched[stitched.length - 1]
        let bestIndex = 0
        let bestReverse = false
        let bestDistance = Infinity

        remaining.forEach((coords, index) => {
            const startDistance = coordinateDistance(tail, coords[0])
            const endDistance = coordinateDistance(tail, coords[coords.length - 1])
            if (startDistance < bestDistance) {
                bestDistance = startDistance
                bestIndex = index
                bestReverse = false
            }
            if (endDistance < bestDistance) {
                bestDistance = endDistance
                bestIndex = index
                bestReverse = true
            }
        })

        const next = remaining.splice(bestIndex, 1)[0]
        stitched = stitched.concat(bestReverse ? next.reverse() : next)
    }

    return {
        type: 'Feature',
        properties: candidates[0].properties || {},
        geometry: {
            type: 'LineString',
            coordinates: stitched
        }
    }
}

function coordinateDistance(a, b) {
    return turf.distance(turf.point(a), turf.point(b), { units: 'kilometers' })
}

function getLineStringCandidates(feature) {
    if (feature.geometry?.type === 'LineString') {
        return feature.geometry.coordinates.length > 1 ? [feature] : []
    }

    if (feature.geometry?.type !== 'MultiLineString') return []

    return feature.geometry.coordinates
        .filter(coords => Array.isArray(coords) && coords.length > 1)
        .map(coords => ({
            type: 'Feature',
            properties: feature.properties || {},
            geometry: { type: 'LineString', coordinates: coords }
        }))
}

function getTerminalStationLine(lineCode) {
    const sequence = getLineTourStationSequence(lineCode)
    const coordinates = sequence
        .map(code => findStationCoordinates(code))
        .filter(Boolean)

    if (coordinates.length < 2) return null

    return {
        type: 'Feature',
        properties: { code: lineCode, stationSequence: sequence },
        geometry: {
            type: 'LineString',
            coordinates
        }
    }
}

function getLineTourStationSequence(lineCode) {
    const lrtHub = lrtLineHubs[lineCode]
    if (lrtHub) {
        const lineStations = [...(generatedLineSequences[lineCode] || [])].filter(code => code !== lrtHub)
        return [lrtHub, ...lineStations, lrtHub]
    }

    const explicitSequences = {
        EW: filterCodes('EW', /^EW/),
        CC: filterCodes('CC', /^CC/),
        CG: ['CG', 'CG1', 'CG2'],
        CE: ['CC4', 'CE1', 'CE2']
    }

    return explicitSequences[lineCode] || [...(generatedLineSequences[lineCode] || [])]
}

function filterCodes(lineCode, pattern) {
    return (generatedLineSequences[lineCode] || []).filter(code => pattern.test(code))
}

function findStationCoordinates(stationCode) {
    return stationCodeToCoordinates[stationCode] || null
}

function shortestBearingDelta(from, to) {
    return ((((to - from) % 360) + 540) % 360) - 180
}

function addUserCancelListeners(map) {
    const canvas = map.getCanvas()
    const cancel = () => stopLineTourCamera({ stopMapAnimation: true })
    const events = ['pointerdown', 'wheel', 'touchstart']

    events.forEach(event => {
        canvas.addEventListener(event, cancel, { passive: true })
    })

    return () => {
        events.forEach(event => {
            canvas.removeEventListener(event, cancel)
        })
    }
}

function schedule(tour, delay, callback) {
    const timer = setTimeout(callback, delay)
    tour.timers.push(timer)
    return timer
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
}

function easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2
}
