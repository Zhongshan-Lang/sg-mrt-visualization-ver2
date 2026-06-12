import * as turf from '@turf/turf'
import { stationLineToActualCode } from '../config'
import { PE_LINE, PE_LOWER_TERMINAL, PE_UPPER_TERMINAL, PTC_CODE } from './specialLineRules'

export function findRouteBFS(start, end, graph) {
    if (!graph[start] || !graph[end]) return null

    const queue = [{ station: start, path: [start], lines: [] }]
    const visited = new Set([start])

    while (queue.length > 0) {
        const { station, path, lines } = queue.shift()

        if (station === end) {
            return buildSegments(path, lines)
        }

        const neighbors = graph[station] || []
        for (const neighbor of neighbors) {
            if (visited.has(neighbor.station)) continue

            visited.add(neighbor.station)
            queue.push({
                station: neighbor.station,
                path: [...path, neighbor.station],
                lines: [...lines, neighbor.line]
            })
        }
    }

    return null
}

export function findRouteDijkstraByDistance(start, end, graph, mrtData) {
    if (!graph[start] || !graph[end]) return null

    const coords = buildStationCoordMap(mrtData)
    const lineMap = buildLineFeatureMap(mrtData)
    const edgeWeight = (fromCode, toCode) => {
        const a = coords[fromCode]
        const b = coords[toCode]
        const railDistance = getRailEdgeDistance(fromCode, toCode, graph[fromCode], coords, lineMap)
        if (railDistance !== null) return railDistance
        if (a && b) return turf.distance(a, b, { units: 'kilometers' })
        return 1
    }

    const heap = [{ station: start, dist: 0, path: [start], lines: [] }]
    const dist = { [start]: 0 }

    while (heap.length > 0) {
        const item = extractMin(heap, 'dist')
        const { station, dist: curDist, path, lines } = item

        if (station === end) return buildSegments(path, lines)
        if (curDist > (dist[station] || Infinity)) continue

        const neighbors = graph[station] || []
        for (const neighbor of neighbors) {
            const weight = neighbor.line === 'transfer' ? 0.2 : edgeWeight(station, neighbor.station)
            const newDist = curDist + weight
            const bestSoFar = dist[neighbor.station]

            if (bestSoFar === undefined || newDist < bestSoFar) {
                dist[neighbor.station] = newDist
                heap.push({
                    station: neighbor.station,
                    dist: newDist,
                    path: [...path, neighbor.station],
                    lines: [...lines, neighbor.line]
                })
            }
        }
    }

    return null
}

export function findRouteFewestTransfersInGraph(start, end, graph) {
    if (!graph[start] || !graph[end]) return null

    const heap = [{ station: start, cost: 0, hops: 0, priority: 0, path: [start], lines: [] }]
    const best = { [start]: { cost: 0, hops: 0 } }

    while (heap.length > 0) {
        const item = extractMin(heap, 'priority')
        const { station, cost: curCost, hops: curHops, path, lines } = item

        if (station === end) return buildSegments(path, lines)
        const bestHere = best[station]
        if (bestHere && (curCost > bestHere.cost || (curCost === bestHere.cost && curHops > bestHere.hops))) continue

        const neighbors = graph[station] || []
        for (const neighbor of neighbors) {
            const weight = neighbor.line === 'transfer' ? 1 : 0
            const newCost = curCost + weight
            const newHops = curHops + 1
            const bestSoFar = best[neighbor.station]

            if (bestSoFar === undefined || newCost < bestSoFar.cost || (newCost === bestSoFar.cost && newHops < bestSoFar.hops)) {
                best[neighbor.station] = { cost: newCost, hops: newHops }
                heap.push({
                    station: neighbor.station,
                    cost: newCost,
                    hops: newHops,
                    priority: newCost * 1000 + newHops,
                    path: [...path, neighbor.station],
                    lines: [...lines, neighbor.line]
                })
            }
        }
    }

    return null
}

function extractMin(heap, key) {
    let minIdx = 0
    for (let i = 1; i < heap.length; i++) {
        if (heap[i][key] < heap[minIdx][key]) minIdx = i
    }

    const item = heap[minIdx]
    heap[minIdx] = heap[heap.length - 1]
    heap.pop()
    return item
}

function buildStationCoordMap(mrtData) {
    const map = {}
    if (!mrtData?.features) return map

    mrtData.features.forEach(feature => {
        if (feature.geometry.type === 'Point' &&
            feature.properties.stop_type !== 'entrance' &&
            feature.properties.type !== 'subway') {
            const codes = (feature.properties.station_codes || '').split('-')
            codes.forEach(code => {
                if (!map[code]) map[code] = feature.geometry.coordinates
            })
        }
    })

    return map
}

function buildLineFeatureMap(mrtData) {
    const map = {}
    if (!mrtData?.features) return map

    mrtData.features.forEach(feature => {
        if ((feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') &&
            feature.properties.code) {
            map[feature.properties.code] = feature
        }
    })

    return map
}

function getRailEdgeDistance(fromCode, toCode, neighbors, coords, lineMap) {
    const edge = neighbors?.find(n => n.station === toCode)
    if (!edge || edge.line === 'transfer') return null

    const actualCode = stationLineToActualCode[edge.line] || edge.line
    const lineFeature = lineMap[actualCode]
    const a = coords[fromCode]
    const b = coords[toCode]
    if (!lineFeature || !a || !b) return null

    if (actualCode === PE_LINE) {
        const peDistance = getPERailEdgeDistance(fromCode, toCode, coords, lineFeature)
        if (peDistance !== null) return peDistance
    }

    const geoms = lineFeature.geometry.type === 'MultiLineString'
        ? lineFeature.geometry.coordinates
        : [lineFeature.geometry.coordinates]

    let bestLength = Infinity
    geoms.forEach(geom => {
        const length = getSliceLength(a, b, geom)
        if (length !== null && length < bestLength) bestLength = length
    })

    return Number.isFinite(bestLength) ? bestLength : null
}

function getPERailEdgeDistance(fromCode, toCode, coords, lineFeature) {
    if (lineFeature.geometry.type !== 'MultiLineString') return null

    const [upperConnector, mainLoop, lowerConnector] = lineFeature.geometry.coordinates
    if (!upperConnector || !mainLoop || !lowerConnector) return null

    const upperJunction = upperConnector[0]
    const lowerConnectorStart = lowerConnector[0]
    const lowerJunction = lowerConnector[lowerConnector.length - 1]
    const ptc = coords[PTC_CODE]

    const lengthBetween = (start, end, geom) => getSliceLength(start, end, geom)
    const sum = (...values) => values.every(v => v !== null)
        ? values.reduce((total, value) => total + value, 0)
        : null

    if ((fromCode === PTC_CODE && toCode === PE_UPPER_TERMINAL) || (fromCode === PE_UPPER_TERMINAL && toCode === PTC_CODE)) {
        const station = fromCode === PE_UPPER_TERMINAL ? coords[fromCode] : coords[toCode]
        return sum(
            lengthBetween(ptc, upperJunction, upperConnector),
            lengthBetween(upperJunction, station, mainLoop)
        )
    }

    if ((fromCode === PTC_CODE && toCode === PE_LOWER_TERMINAL) || (fromCode === PE_LOWER_TERMINAL && toCode === PTC_CODE)) {
        const station = fromCode === PE_LOWER_TERMINAL ? coords[fromCode] : coords[toCode]
        return sum(
            lengthBetween(ptc, lowerConnectorStart, upperConnector),
            lengthBetween(lowerConnectorStart, lowerJunction, lowerConnector),
            lengthBetween(lowerJunction, station, mainLoop)
        )
    }

    if (fromCode.startsWith('PE') && toCode.startsWith('PE')) {
        return lengthBetween(coords[fromCode], coords[toCode], mainLoop)
    }

    return null
}

function getSliceLength(a, b, geom) {
    if (turf.distance(turf.point(a), turf.point(b), { units: 'kilometers' }) < 0.05) return null

    const line = turf.lineString(geom)
    const maxSnapDistanceKm = 0.4
    const startSnap = turf.nearestPointOnLine(line, turf.point(a), { units: 'kilometers' })
    const endSnap = turf.nearestPointOnLine(line, turf.point(b), { units: 'kilometers' })
    if ((startSnap.properties.dist ?? Infinity) > maxSnapDistanceKm ||
        (endSnap.properties.dist ?? Infinity) > maxSnapDistanceKm) {
        return null
    }

    try {
        const fwd = turf.lineSlice(turf.point(a), turf.point(b), line)
        const rev = turf.lineSlice(turf.point(a), turf.point(b), turf.lineString([...geom].reverse()))
        return [fwd, rev]
            .filter(Boolean)
            .map(slice => turf.length(slice))
            .filter(length => length > 0.02)
            .sort((x, y) => x - y)[0] ?? null
    } catch (_) {
        return null
    }
}

function buildSegments(path, lines) {
    const compressedPath = [path[0]]
    const compressedLines = []

    for (let i = 1; i < path.length; i++) {
        if (path[i] !== path[i - 1]) {
            compressedPath.push(path[i])
            compressedLines.push(lines[i - 1])
        }
    }

    const segments = []
    let currentLine = null
    let currentStations = []

    for (let i = 0; i < compressedLines.length; i++) {
        const from = compressedPath[i]
        const to = compressedPath[i + 1]
        const line = compressedLines[i]

        if (line === 'transfer') {
            if (currentLine && currentStations[currentStations.length - 1] !== to) {
                currentStations.push(to)
            }
            continue
        }

        if (line !== currentLine) {
            if (currentLine && currentStations.length > 1) {
                segments.push({ line: currentLine, stations: currentStations })
            }
            currentLine = line
            currentStations = [from, to]
        } else if (currentStations[currentStations.length - 1] !== to) {
            currentStations.push(to)
        }
    }

    if (currentLine && currentStations.length > 1) {
        segments.push({ line: currentLine, stations: currentStations })
    }

    const result = segments.filter((segment, i) =>
        !(i === 0 && segment.stations.length <= 1) &&
        !(i === segments.length - 1 && segment.stations.length <= 1)
    )

    return result.length > 0 ? result : [{ line: 'Unknown', stations: compressedPath }]
}
