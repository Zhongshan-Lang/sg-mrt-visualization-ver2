const modules = import.meta.glob(
    '../../assets/stations/**/*.{jpg,png,jpeg}',
)

const stationImageLoaders = {}

for (const path in modules) {

    const parts = path.split('/')

    const stationName = parts[4]

    if (!stationImageLoaders[stationName]) {
        stationImageLoaders[stationName] = []
    }

    stationImageLoaders[stationName].push(modules[path])
}

export async function loadStationImages(stationName) {
    const loaders = stationImageLoaders[stationName] || []
    const images = await Promise.all(loaders.map(loader => loader().then(module => module.default)))
    return images
}

export default stationImageLoaders
