import oldMrtData from '../singapore-mrt.json'

const wikipediaUrlMap = {}

oldMrtData.features.forEach(feature => {
    if (feature.properties.name && feature.properties.wikipedia_url) {
        wikipediaUrlMap[feature.properties.name] = feature.properties.wikipedia_url
    }
})

export function getWikipediaUrl(stationName) {
    return wikipediaUrlMap[stationName] || '#'
}
