import { generatedLineSequences } from '../data/generated/lineIndex'
import {
    findRouteBFS,
    findRouteDijkstraByDistance,
    findRouteFewestTransfersInGraph
} from './routeAlgorithms'
import {
    branchBridges,
    getCodePrefix,
    lrtHubLinks,
    linePrefixGroups,
    shouldConnectSequentially
} from './specialLineRules'

export function buildStationGraph(mrtData) {
    const graph = {}

    Object.entries(generatedLineSequences).forEach(([lineCode, stations]) => {
        for (let i = 0; i < stations.length - 1; i++) {
            const from = stations[i]
            const to = stations[i + 1]

            if (!shouldConnectSequentially(from, to, lineCode)) continue

            if (!graph[from]) graph[from] = []
            if (!graph[to]) graph[to] = []

            graph[from].push({ station: to, line: lineCode })
            graph[to].push({ station: from, line: lineCode })
        }

        for (let i = 0; i < stations.length; i++) {
            const prefix = getCodePrefix(stations[i])
            const groups = linePrefixGroups[lineCode]
            if (!groups || groups.length < 2) continue
            const mainGroup = groups[0]
            if (!mainGroup.includes(prefix)) continue

            for (let j = i + 1; j < stations.length; j++) {
                const nxtPrefix = getCodePrefix(stations[j])
                if (mainGroup.includes(nxtPrefix)) {
                    const from = stations[i]
                    const to = stations[j]
                    if (!graph[from].find(e => e.station === to && e.line === lineCode)) {
                        graph[from].push({ station: to, line: lineCode })
                        graph[to].push({ station: from, line: lineCode })
                    }
                    break
                }
            }
        }
    })

    Object.entries(branchBridges).forEach(([line, pairs]) => {
        pairs.forEach(([a, b]) => {
            if (!graph[a]) graph[a] = []
            if (!graph[b]) graph[b] = []
            if (!graph[a].find(n => n.station === b)) graph[a].push({ station: b, line })
            if (!graph[b].find(n => n.station === a)) graph[b].push({ station: a, line })
        })
    })

    if (mrtData && mrtData.features) {
        mrtData.features.forEach(feature => {
            if (feature.geometry.type === 'Point' &&
                feature.properties.stop_type !== 'entrance' &&
                feature.properties.type !== 'subway') {

                const codes = (feature.properties.station_codes || '').split('-')
                if (codes.length > 1) {
                    codes.forEach(codeA => {
                        if (!graph[codeA]) graph[codeA] = []
                        codes.forEach(codeB => {
                            if (codeA !== codeB && !graph[codeA].find(n => n.station === codeB)) {
                                graph[codeA].push({ station: codeB, line: 'transfer' })
                            }
                        })
                    })
                }
            }
        })
    }

    Object.entries(lrtHubLinks).forEach(([hubCode, links]) => {
        if (!graph[hubCode]) return
        Object.entries(links).forEach(([lrtStation, line]) => {
            if (graph[lrtStation] && !graph[hubCode].find(n => n.station === lrtStation)) {
                graph[hubCode].push({ station: lrtStation, line })
                graph[lrtStation].push({ station: hubCode, line })
            }
        })
    })

    if (graph.BP6 && graph.DT1 && !graph.BP6.find(n => n.station === 'DT1')) {
        graph.BP6.push({ station: 'DT1', line: 'transfer' })
        graph.DT1.push({ station: 'BP6', line: 'transfer' })
    }

    return graph
}

export function findRoute(start, end, mrtData) {
    const graph = buildStationGraph(mrtData)
    return findRouteBFS(start, end, graph)
}

export function findRouteDijkstra(start, end, mrtData) {
    const graph = buildStationGraph(mrtData)
    return findRouteDijkstraByDistance(start, end, graph, mrtData)
}

export function findRouteFewestTransfers(start, end, mrtData) {
    const graph = buildStationGraph(mrtData)
    return findRouteFewestTransfersInGraph(start, end, graph)
}

export function getStationLines(stationCode) {
    const lines = []
    Object.entries(generatedLineSequences).forEach(([line, stations]) => {
        if (stations.includes(stationCode)) {
            lines.push(line)
        }
    })
    return lines
}
