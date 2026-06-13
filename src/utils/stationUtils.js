import { stationLineToActualCode, lineColors, lineCameraPresets } from '../config'
import {
    stationCodeToCoordinates,
    stationCodeToData,
    stationCodeGroups
} from '../data/generated/stationIndex'
import { stationEntrancesByCodes } from '../data/generated/stationEntrances'
import { getAdjacentStations } from '../utils/stationNavigation'
import { lrtHubLines } from '../routing/specialLineRules'
import { startLineTourCamera } from '../camera/lineTourCamera'

const stationSearchFeatures = buildStationSearchFeatures()

export function findStationFeature(stationCode, mrtData = null) {
    if (mrtData?.features) {
        return mrtData.features.find(f => {
            if (f.geometry.type !== 'Point') return false
            if (f.properties.stop_type === 'entrance') return false
            if (f.properties.type === 'subway') return false
            const codes = (f.properties.station_codes || '').split('-')
            return codes.includes(stationCode)
        }) || null
    }

    const stationCodes = stationCodeGroups[stationCode]
    const stationData = stationCodeToData[stationCode]
    const coordinates = stationCodeToCoordinates[stationCode]
    if (!stationCodes || !stationData || !coordinates) return null

    return createStationFeature(stationCodes, stationData, coordinates)
}

export function getStationActualLines(stationCodes) {
    return (stationCodes || '').split('-')
        .map(line => {
            const prefix = line.match(/^[A-Z]+/)?.[0]
            return stationLineToActualCode[prefix] || prefix
        })
        .filter(Boolean)
}

export function getStationEntrances(targetCodes) {
    return (stationEntrancesByCodes[targetCodes] || []).map(entrance => ({
        type: 'Feature',
        properties: {
            name: entrance.name,
            station_codes: targetCodes,
            stop_type: 'entrance'
        },
        geometry: {
            type: 'Point',
            coordinates: entrance.coordinates
        }
    }))
}

export function getStationConnections(stationCodes, generatedLineSequences) {
    const codes = stationCodes.split('-')
    const connections = []

    codes.forEach(fullCode => {
        const lineCode = fullCode.match(/[A-Z]+/)?.[0]
        const actualLine = stationLineToActualCode[lineCode] || lineCode

        if (!lrtHubLines[fullCode]) {
            const stations = getAdjacentStations(actualLine, fullCode)
            if (stations) {
                connections.push({ lineCode: actualLine, stations })
            }
        }

        if (fullCode === 'CC4') {
            connections.push({
                lineCode: 'CE',
                stations: { prev: null, current: 'CC4', next: 'CE1' }
            })
        }

        ;(lrtHubLines[fullCode] || []).forEach(lrtLine => {
            const sequence = generatedLineSequences[lrtLine] || []
            if (sequence.length > 0) {
                connections.push({
                    lineCode: lrtLine,
                    stations: { prev: sequence[sequence.length - 1] || null, current: fullCode, next: sequence[0] || null }
                })
            }
        })

        if (fullCode === 'BP6') {
            connections.push({
                lineCode: 'BP',
                _branch: true,
                stations: { prev: null, current: 'BP6', next: 'BP13' }
            })
        }
    })

    return connections
}

export function searchStations(query, limit = 8) {
    if (!query.trim()) return []
    const q = query.toLowerCase()

    return stationSearchFeatures.filter(feature => {
        const name = (feature.properties.name || '').toLowerCase()
        const zh = (feature.properties.name_zh || '').toLowerCase()
        const code = (feature.properties.station_codes || '').toLowerCase()
        return name.includes(q) || zh.includes(q) || code.includes(q)
    }).slice(0, limit)
}

export function getAllLines(mrtData) {
    const lines = []
    const seen = new Set()
    mrtData.features.forEach(f => {
        if ((f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString') && f.properties.code) {
            if (!seen.has(f.properties.code)) {
                seen.add(f.properties.code)
                lines.push({
                    code: f.properties.code,
                    name: f.properties.name || f.properties.code,
                    color: f.properties.color || lineColors[f.properties.code] || '#808080',
                    feature: f
                })
            }
        }
    })
    return lines
}

export function findLineFeature(mrtData, lineCode) {
    return mrtData?.features?.find(f =>
        (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString') &&
        f.properties.code === lineCode
    ) || null
}

export function flyToLine(lineCode, mapRef, setSelectedLine, setSelectedLines, setIsEntering, lineFeature) {
    if (!lineFeature || !mapRef.current) return

    const preset = lineCameraPresets[lineCode]
    if (preset) {
        startLineTourCamera(mapRef, lineCode, lineFeature)
    }
    setIsEntering(true)
    setSelectedLine({ ...lineFeature.properties })
    setSelectedLines([lineCode])
    setTimeout(() => setIsEntering(false), 150)
}

function buildStationSearchFeatures() {
    const seen = new Set()
    const features = []

    Object.entries(stationCodeGroups).forEach(([code, codes]) => {
        const key = codes.join('-')
        if (seen.has(key)) return
        seen.add(key)

        const stationData = stationCodeToData[code]
        const coordinates = stationCodeToCoordinates[code]
        if (!stationData || !coordinates) return

        features.push(createStationFeature(codes, stationData, coordinates))
    })

    return features
}

function createStationFeature(stationCodes, stationData, coordinates) {
    return {
        type: 'Feature',
        properties: {
            name: stationData.en,
            name_zh: stationData.zh,
            name_ta: stationData.ta,
            station_codes: stationCodes.join('-')
        },
        geometry: {
            type: 'Point',
            coordinates
        }
    }
}
