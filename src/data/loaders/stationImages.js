let stationImagesManifestPromise = null

export async function loadStationImages(stationName) {
    if (!stationName) return []

    const manifest = await loadStationImagesManifest()
    return manifest[String(stationName)] || []
}

async function loadStationImagesManifest() {
    if (!stationImagesManifestPromise) {
        stationImagesManifestPromise = fetch(`${import.meta.env.BASE_URL}data/station-images.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load station image manifest: ${response.status}`)
                }
                return response.json()
            })
            .then(data => {
                const normalized = {}
                Object.entries(data || {}).forEach(([stationName, imagePaths]) => {
                    normalized[stationName] = (imagePaths || []).map(path => `${import.meta.env.BASE_URL}${path}`)
                })
                return normalized
            })
    }

    return stationImagesManifestPromise
}
