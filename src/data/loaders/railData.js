let railDataPromise = null

export async function loadRailData() {
    if (!railDataPromise) {
        railDataPromise = fetch(`${import.meta.env.BASE_URL}data/sg-rail.geo.json`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load rail data: ${response.status}`)
                }
                return response.json()
            })
    }

    return railDataPromise
}
