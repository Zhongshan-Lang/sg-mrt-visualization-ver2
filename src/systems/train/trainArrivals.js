function getLineLabel(routeKey) {
    return routeKey.replace('_MAIN', '').replace('_CG', '').replace('_CE', '')
}

function getDistanceToStation(train, stationDistance) {
    if (train.direction === 1) {
        let distToGo = stationDistance - train.distance
        if (distToGo < -0.1) {
            distToGo = stationDistance + train.route.length - train.distance
        }
        return distToGo
    }

    let distToGo = train.distance - stationDistance
    if (distToGo < -0.1) {
        distToGo = train.distance + train.route.length - stationDistance
    }
    return distToGo
}

function getTerminalCode(train, stations) {
    const termIndex = train.direction === 1 ? stations.length - 1 : 0
    return stations[termIndex]?.code || ''
}

export function buildStationArrivals({ stationCode, trains, routeStations, routeColors }) {
    const arrivals = []
    if (!routeStations) return arrivals

    trains.forEach(train => {
        try {
            const stations = routeStations[train.routeKey]
            if (!stations) return

            const idx = stations.findIndex(station => station.code === stationCode)
            if (idx < 0) return

            const stationDistance = stations[idx].distance
            const distToGo = getDistanceToStation(train, stationDistance)
            if (distToGo < -0.05) return

            const avgSpeed = train.speed > 0.001 ? train.speed : 0.01
            const etaMin = (distToGo / avgSpeed) / 60
            if (etaMin < 0 || etaMin > 30) return

            arrivals.push({
                line: getLineLabel(train.routeKey),
                groupKey: train.routeKey,
                lineColor: routeColors[train.routeKey] || '#fff',
                direction: train.direction,
                etaMin: Math.round(etaMin),
                terminal: getTerminalCode(train, stations),
            })
        } catch {
            // Skip trains that cannot produce a valid arrival estimate for this station.
        }
    })

    const groups = {}
    arrivals.forEach(arrival => {
        const key = arrival.terminal
        if (!groups[key]) groups[key] = []
        groups[key].push(arrival)
    })

    const result = []
    Object.values(groups).forEach(group => {
        group.sort((a, b) => a.etaMin - b.etaMin)
        result.push(...group.slice(0, 2))
    })

    result.sort((a, b) => a.etaMin - b.etaMin)
    return result
}
