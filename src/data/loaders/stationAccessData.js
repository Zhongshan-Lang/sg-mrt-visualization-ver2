import { getExitLandmarksForStation } from './exitLandmarkData'
import { getStationEntrancesForStation } from './stationEntranceData'

const emptyStationAccessData = Object.freeze({
    stationCodes: '',
    entrances: [],
    landmarks: {}
})

const stationAccessPromiseByCodes = new Map()

export async function getStationAccessDataForStation(stationCodes) {
    const key = String(stationCodes || '')
    if (!key) return emptyStationAccessData

    if (!stationAccessPromiseByCodes.has(key)) {
        stationAccessPromiseByCodes.set(
            key,
            Promise.all([
                getStationEntrancesForStation(key),
                getExitLandmarksForStation(key)
            ]).then(([entrances, landmarks]) => ({
                stationCodes: key,
                entrances: entrances || [],
                landmarks: landmarks || {}
            })).catch(() => ({
                stationCodes: key,
                entrances: [],
                landmarks: {}
            }))
        )
    }

    return stationAccessPromiseByCodes.get(key)
}

export function createEmptyStationAccessData(stationCodes = '') {
    if (!stationCodes) return emptyStationAccessData
    return {
        stationCodes: String(stationCodes),
        entrances: [],
        landmarks: {}
    }
}
