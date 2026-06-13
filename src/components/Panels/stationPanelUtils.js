import { stationCodeToData } from '../../data/generated/stationIndex'

export function getDisplayImages(images) {
    return images.length > 0
        ? images
        : ['https://placehold.co/600x400/111111/FFFFFF?text=Station']
}

export function naturalExitSort(a, b) {
    const ia = parseInt(a)
    const ib = parseInt(b)
    if (!Number.isNaN(ia) && !Number.isNaN(ib)) return ia - ib
    if (!Number.isNaN(ia)) return -1
    if (!Number.isNaN(ib)) return 1
    return String(a).localeCompare(String(b))
}

export function groupArrivalsByTerminal(arrivals = []) {
    const groups = {}
    arrivals.forEach(arrival => {
        const key = arrival.terminal
        if (!groups[key]) groups[key] = { ...arrival, trains: [] }
        groups[key].trains.push(arrival)
    })
    return Object.values(groups)
}

export function getStationLabel(code, language) {
    return stationCodeToData[code]?.[language] || stationCodeToData[code]?.en || code
}
