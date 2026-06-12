import { stationCodeToData } from '../../data/generated/stationIndex'

export function buildTrainPanelData(train) {
    const routeKey = train.routeKey
    const stations = train._routeStations || []
    const targetIndex = train.currentStationIndex + train.direction

    const nextCode = stations[targetIndex]?.code || null
    const nextName = stationCodeToData[nextCode]?.en || nextCode
    const curCode = stations[train.currentStationIndex]?.code || null
    const curName = stationCodeToData[curCode]?.en || curCode

    const terminalIndex = train.direction === 1 ? stations.length - 1 : 0
    const termCode = stations[terminalIndex]?.code || ''
    const termName = stationCodeToData[termCode]?.en || termCode

    const shortName = routeKey
        .replace('_MAIN', ' Main')
        .replace('_CG', ' CG')
        .replace('_CE', ' CE')
    const trainNum = shortName + ' ' + train.id
        .replace(routeKey + '_', '')
        .replace('_r', 'R')

    return {
        id: train.id,
        routeKey: train.routeKey,
        direction: train.direction,
        currentStationIndex: train.currentStationIndex,
        speed: train.speed,
        targetSpeed: train.targetSpeed || 0.01,
        waitTimer: train.waitTimer,
        braking: train._braking || false,
        distance: train.distance,
        lineColor: train.visualColor || train.lineColor || '#808080',
        trainNum,
        shortName,
        termCode,
        termName,
        curCode,
        curName,
        nextCode,
        nextName,
        stations,
        isTracking: true,
    }
}
