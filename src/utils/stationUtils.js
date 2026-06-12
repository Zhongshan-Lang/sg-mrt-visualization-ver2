import mrtData from '../data/sg-rail.geo.json'
import { stationLineToActualCode, lineColors, lineCameraPresets } from '../config'
import { getAdjacentStations } from '../utils/stationNavigation'
import { lrtHubLines } from '../routing/specialLineRules'
import { startLineTourCamera } from '../camera/lineTourCamera'

export function findStationFeature(stationCode) {
    return mrtData.features.find(f => {
        if (f.geometry.type !== 'Point') return false
        if (f.properties.stop_type === 'entrance') return false
        if (f.properties.type === 'subway') return false
        const codes = (f.properties.station_codes || '').split('-')
        return codes.includes(stationCode)
    })
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
    return mrtData.features.filter(f =>
        f.properties.stop_type === 'entrance' &&
        f.properties.station_codes === targetCodes
    )
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
    return mrtData.features.filter(f => {
        if (f.geometry.type !== 'Point') return false
        if (f.properties.stop_type === 'entrance') return false
        if (f.properties.type === 'subway') return false
        const name = (f.properties.name || '').toLowerCase()
        const zh = (f.properties.name_zh || '').toLowerCase()
        const code = (f.properties.station_codes || '').toLowerCase()
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
                    color: f.properties.color || lineColors[f.properties.code] || '#808080'
                })
            }
        }
    })
    return lines
}

export function flyToLine(lineCode, mapRef, setSelectedLine, setSelectedLines, setIsEntering) {
    const lineFeature = mrtData.features.find(f =>
        (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString') &&
        f.properties.code === lineCode
    )
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
