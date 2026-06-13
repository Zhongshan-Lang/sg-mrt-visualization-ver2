import { stationCodeToData, stationCodeGroups } from '../../data/generated/stationIndex'
import { linePropertiesByCode } from '../../data/generated/lineIndex'

const DWELL_SECONDS = 25
const languageTransition = 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s cubic-bezier(0.22,1,0.36,1)'

export function getAllCodesForStation(code) {
    if (!code) return []
    return stationCodeGroups[code] || [code]
}

export function getLineFullName(routeKey = '') {
    const code = routeKey.replace('_MAIN', '').replace('_CG', '').replace('_CE', '')
    return linePropertiesByCode[code]?.name || routeKey
}

export function getStationName(code, language) {
    return stationCodeToData[code]?.[language] || code
}

export function animatedLanguageStyle(labelOpacity, opacity = labelOpacity) {
    return {
        opacity,
        transition: languageTransition,
        transform: labelOpacity === 0 ? 'translateY(4px) scale(0.95)' : 'translateY(0px) scale(1)',
        filter: labelOpacity === 0 ? 'blur(4px)' : 'blur(0px)'
    }
}

export function buildTrainPanelState(trainData = {}, stationLabelLanguage) {
    const lineColor = trainData.lineColor || '#808080'
    const stations = trainData.stations || []
    const direction = trainData.direction || 1
    const atStation = Boolean(trainData.waitTimer > 0 || trainData.braking)
    const activeIndex = atStation
        ? trainData.currentStationIndex
        : trainData.currentStationIndex + direction
    const activeCode = atStation ? trainData.curCode : trainData.nextCode
    const activeCodes = getAllCodesForStation(activeCode)
    const orderedStations = direction === 1 ? stations : [...stations].reverse()
    const activeName = getStationName(activeCode, stationLabelLanguage)
    const stationETAs = buildStationEtas({
        atStation,
        waitTimer: trainData.waitTimer,
        distance: trainData.distance,
        targetSpeed: trainData.targetSpeed,
        stations,
        orderedStations,
        direction,
        activeIndex
    })

    return {
        lineColor,
        stations,
        direction,
        atStation,
        activeIndex,
        activeCode,
        activeCodes,
        activeName,
        orderedStations,
        stationETAs
    }
}

function buildStationEtas({
    atStation,
    waitTimer,
    distance,
    targetSpeed,
    stations,
    orderedStations,
    direction,
    activeIndex
}) {
    const cruisingSpeed = targetSpeed || 0.01
    const stationETAs = {}
    let cumulativeSeconds = atStation ? waitTimer : 0
    let previousDistance = distance

    for (const station of orderedStations) {
        const originalIndex = stations.indexOf(station)
        const isAhead = direction === 1 ? originalIndex >= activeIndex : originalIndex <= activeIndex
        if (!isAhead) continue

        const segmentDistance = Math.abs(station.distance - previousDistance)
        cumulativeSeconds += segmentDistance / cruisingSpeed
        if (cumulativeSeconds > 0) cumulativeSeconds += DWELL_SECONDS
        stationETAs[station.code] = Math.max(0, Math.round(cumulativeSeconds / 60))
        previousDistance = station.distance
    }

    return stationETAs
}
