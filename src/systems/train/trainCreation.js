export function getInitialTrainCoord(feature) {
    if (feature.geometry.type === 'MultiLineString') {
        return feature.geometry.coordinates?.[0]?.[0] || null
    }
    return feature.geometry.coordinates?.[0] || null
}

export function getInitialStationIndex(stations, distance, direction) {
    if (!stations?.length) return 0

    if (direction === -1) {
        for (let i = stations.length - 1; i >= 0; i -= 1) {
            if (stations[i].distance <= distance) {
                return i
            }
        }
        return stations.length - 1
    }

    for (let i = 0; i < stations.length; i += 1) {
        if (stations[i].distance > distance) {
            return Math.max(0, i - 1)
        }
    }

    return 0
}

export function bindTrainMarkerEvents({
    bodyEl,
    getTrain,
    onHoverStart,
    onHoverEnd,
    onClick,
}) {
    bodyEl.addEventListener('mouseenter', () => {
        const train = getTrain()
        if (train) onHoverStart(train)
    })

    bodyEl.addEventListener('mouseleave', () => {
        onHoverEnd()
    })

    bodyEl.addEventListener('click', (event) => {
        event.stopPropagation()
        const train = getTrain()
        if (train) onClick(train)
    })
}
