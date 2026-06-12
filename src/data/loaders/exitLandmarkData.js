import exitLandmarks from '../exitLandmarks.json'

export function getExitLandmarksForStation(stationCodes) {
    const parts = (stationCodes || '').split('-').sort()
    const normalizedStationKey = parts.join('-')

    for (const key of Object.keys(exitLandmarks)) {
        if (key.split('-').sort().join('-') === normalizedStationKey) {
            return exitLandmarks[key] || {}
        }
    }

    return {}
}
