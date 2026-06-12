import fs from 'node:fs/promises'
import { createServer } from 'vite'
import * as turf from '@turf/turf'

const mrtData = JSON.parse(await fs.readFile('src/data/sg-rail.geo.json', 'utf8'))

const server = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    logLevel: 'error'
})

let failed = false

function assert(condition, message) {
    if (!condition) {
        failed = true
        console.error(`FAIL ${message}`)
    }
}

function pass(message) {
    console.log(`PASS ${message}`)
}

function getStationCodes(feature) {
    return feature.properties.station_codes
        ? (Array.isArray(feature.properties.station_codes)
            ? feature.properties.station_codes
            : feature.properties.station_codes.split('-'))
        : []
}

function initializeRuntimeIndexes(runtimeIndexes, stationLineToActualCode) {
    const {
        stationCodeToName,
        stationCodeToData,
        stationCodeGroups,
        stationEntrancesByCodes,
        linePropertiesByCode,
        generatedLineSequences
    } = runtimeIndexes

    ;[
        stationCodeToName,
        stationCodeToData,
        stationCodeGroups,
        stationEntrancesByCodes,
        linePropertiesByCode,
        generatedLineSequences
    ].forEach(index => {
        Object.keys(index).forEach(key => delete index[key])
    })

    mrtData.features.forEach(feature => {
        const props = feature.properties || {}

        if ((feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') && props.code) {
            linePropertiesByCode[props.code] = { ...props }
        }

        if (props.stop_type === 'entrance') {
            const key = props.station_codes || ''
            if (!stationEntrancesByCodes[key]) stationEntrancesByCodes[key] = []
            stationEntrancesByCodes[key].push({
                name: props.name,
                coordinates: feature.geometry.coordinates
            })
            return
        }

        if (props.type === 'subway' && feature.geometry.type === 'Polygon') return
        if (feature.geometry.type !== 'Point') return

        const stationCodes = getStationCodes(feature)
        stationCodes.forEach(code => {
            stationCodeToName[code] = props.name
            stationCodeToData[code] = {
                en: props.name,
                zh: props.name_zh,
                ta: props.name_ta
            }
            stationCodeGroups[code] = stationCodes

            const linePrefix = code.match(/[A-Z]+/)?.[0]
            const actualLine = stationLineToActualCode[linePrefix] || linePrefix
            if (!generatedLineSequences[actualLine]) generatedLineSequences[actualLine] = []
            generatedLineSequences[actualLine].push(code)
        })
    })

    sortLineSequences(generatedLineSequences)
}

function sortLineSequences(generatedLineSequences) {
    const lineOrderMap = {
        CC: ['CC1', 'CC2', 'CC3', 'CC4', 'CE1', 'CE2', 'CC5', 'CC6', 'CC7', 'CC8', 'CC9', 'CC10',
            'CC11', 'CC12', 'CC13', 'CC14', 'CC15', 'CC16', 'CC17', 'CC19', 'CC20', 'CC21', 'CC22',
            'CC23', 'CC24', 'CC25', 'CC26', 'CC27', 'CC28', 'CC29'],
        EW: ['EW1', 'EW2', 'EW3', 'EW4', 'CG', 'CG1', 'CG2', 'EW5', 'EW6', 'EW7', 'EW8', 'EW9',
            'EW10', 'EW11', 'EW12', 'EW13', 'EW14', 'EW15', 'EW16', 'EW17', 'EW18', 'EW19', 'EW20',
            'EW21', 'EW22', 'EW23', 'EW24', 'EW25', 'EW26', 'EW27', 'EW28', 'EW29', 'EW30', 'EW31', 'EW32', 'EW33']
    }

    Object.keys(generatedLineSequences).forEach(line => {
        if (lineOrderMap[line]) {
            const orderMap = lineOrderMap[line]
            generatedLineSequences[line].sort((a, b) => {
                const indexA = orderMap.indexOf(a)
                const indexB = orderMap.indexOf(b)
                if (indexA !== -1 && indexB !== -1) return indexA - indexB
                if (indexA !== -1) return -1
                if (indexB !== -1) return 1
                return stationNumber(a) - stationNumber(b)
            })
        } else {
            generatedLineSequences[line].sort((a, b) => stationNumber(a) - stationNumber(b))
        }
    })
}

function stationNumber(code) {
    return parseInt(code.match(/\d+/)?.[0] || 0)
}

function segmentFor(route, line) {
    return route?.find(segment => segment.line === line)
}

function routeStations(route, line) {
    return segmentFor(route, line)?.stations || []
}

function assertRouteStations(routeUtils, start, end, algorithm, line, expectedStations) {
    const route = routeUtils.calculateRoute(start, end, algorithm, mrtData)
    assert(route, `${algorithm} ${start}->${end} should produce a route`)
    const stations = routeStations(route, line)
    assert(
        JSON.stringify(stations) === JSON.stringify(expectedStations),
        `${algorithm} ${start}->${end} ${line} stations expected ${expectedStations.join('>')}, got ${stations.join('>')}`
    )
    return route
}

function assertFeatureGeometry(routeUtils, route, label, options = {}) {
    const features = routeUtils.buildRouteFeatures(route, mrtData)
    assert(features.length >= (options.minFeatures || 1), `${label} should create route highlight features`)

    features.forEach((feature, index) => {
        const coords = feature.geometry.coordinates
        const length = turf.length(feature)
        assert(coords.length >= 2, `${label} feature ${index} should have coordinates`)
        assert(length > 0.02, `${label} feature ${index} should not be zero-length`)
        if (options.maxFeatureLengthKm) {
            assert(length < options.maxFeatureLengthKm, `${label} feature ${index} should not highlight an excessive line length (${length.toFixed(3)}km)`)
        }
    })

    return features
}

try {
    const runtimeIndexes = await server.ssrLoadModule('/src/data/runtimeIndexes.js')
    const config = await server.ssrLoadModule('/src/config.js')
    initializeRuntimeIndexes(runtimeIndexes, config.stationLineToActualCode)

    const routeUtils = await server.ssrLoadModule('/src/utils/routeUtils.js')

    const peEast = assertRouteStations(routeUtils, 'PTC', 'PE2', 'bfs', 'PE', ['PTC', 'PE1', 'PE2'])
    assertFeatureGeometry(routeUtils, peEast, 'PTC->PE2', { minFeatures: 4, maxFeatureLengthKm: 1.5 })
    pass('PTC->PE2 uses the PE1 side and produces valid geometry')

    const peWest = assertRouteStations(routeUtils, 'PTC', 'PE6', 'bfs', 'PE', ['PTC', 'PE7', 'PE6'])
    assertFeatureGeometry(routeUtils, peWest, 'PTC->PE6', { minFeatures: 3, maxFeatureLengthKm: 1.5 })
    pass('PTC->PE6 uses the PE7 side and produces valid geometry')

    const peDijkstra = assertRouteStations(routeUtils, 'NE17', 'PE6', 'dijkstra', 'PE', ['PTC', 'PE7', 'PE6'])
    assertFeatureGeometry(routeUtils, peDijkstra, 'NE17->PE6 shortest path', { minFeatures: 3, maxFeatureLengthKm: 1.5 })
    pass('NE17->PE6 shortest path keeps the correct PE direction')

    const seRoute = assertRouteStations(routeUtils, 'STC', 'SE2', 'bfs', 'SE', ['STC', 'SE1', 'SE2'])
    assertFeatureGeometry(routeUtils, seRoute, 'STC->SE2', { minFeatures: 2, maxFeatureLengthKm: 1.5 })
    pass('STC->SE2 highlights only the travelled SE section')

    const pwRoute = assertRouteStations(routeUtils, 'PTC', 'PW6', 'bfs', 'PW', ['PTC', 'PW7', 'PW6'])
    assertFeatureGeometry(routeUtils, pwRoute, 'PTC->PW6', { minFeatures: 2, maxFeatureLengthKm: 1.5 })
    pass('PTC->PW6 keeps PW route direction valid')
} finally {
    await server.close()
}

if (failed) {
    process.exitCode = 1
} else {
    console.log('Route regression tests passed.')
}
