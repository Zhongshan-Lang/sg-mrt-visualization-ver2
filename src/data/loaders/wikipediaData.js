let wikipediaUrlMapPromise = null

export async function getWikipediaUrl(stationName) {
    if (!stationName) return '#'
    const wikipediaUrlMap = await loadWikipediaUrlMap()
    return wikipediaUrlMap[stationName] || '#'
}

async function loadWikipediaUrlMap() {
    if (!wikipediaUrlMapPromise) {
        wikipediaUrlMapPromise = fetch(`${import.meta.env.BASE_URL}data/wikipedia-urls.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load wikipedia urls: ${response.status}`)
                }
                return response.json()
            })
    }

    return wikipediaUrlMapPromise
}
