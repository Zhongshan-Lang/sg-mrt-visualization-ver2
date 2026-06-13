let stationEntranceMapPromise = null

export async function getStationEntrancesForStation(stationCodes) {
    const entranceMap = await loadStationEntranceMap()
    return entranceMap[String(stationCodes || '')] || []
}

async function loadStationEntranceMap() {
    if (!stationEntranceMapPromise) {
        stationEntranceMapPromise = fetch(`${import.meta.env.BASE_URL}data/station-entrances.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load station entrances: ${response.status}`)
                }
                return response.json()
            })
    }

    return stationEntranceMapPromise
}
