let exitLandmarkMapPromise = null

export async function getExitLandmarksForStation(stationCodes) {
    const exitLandmarkMap = await loadExitLandmarkMap()
    return exitLandmarkMap[normalizeStationKey(stationCodes)] || {}
}

async function loadExitLandmarkMap() {
    if (!exitLandmarkMapPromise) {
        exitLandmarkMapPromise = fetch(`${import.meta.env.BASE_URL}data/exitLandmarks.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load exit landmarks: ${response.status}`)
                }
                return response.json()
            })
            .then(data => {
                const normalized = {}
                Object.entries(data || {}).forEach(([key, value]) => {
                    normalized[normalizeStationKey(key)] = value || {}
                })
                return normalized
            })
    }

    return exitLandmarkMapPromise
}

function normalizeStationKey(stationCodes) {
    return String(stationCodes || '')
        .split('-')
        .filter(Boolean)
        .sort()
        .join('-')
}
