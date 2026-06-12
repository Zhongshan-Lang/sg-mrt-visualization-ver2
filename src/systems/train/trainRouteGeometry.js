import * as turf from '@turf/turf'

import { generatedLineSequences } from '../../data/generated/lineIndex'
import { lrtLineHubs } from '../../routing/specialLineRules'

function inferLineCode(feature) {
    let code = feature.properties.code
    const stationCodes = (feature.properties.station_codes || '').split('-')

    if (code) return code
    if (stationCodes.some(s => s.startsWith('NS'))) return 'NS'
    if (stationCodes.some(s => s.startsWith('EW'))) return 'EW'
    if (stationCodes.some(s => s.startsWith('CG'))) return 'CG'
    if (stationCodes.some(s => s.startsWith('NE'))) return 'NE'
    if (stationCodes.some(s => s.startsWith('CC'))) return 'CC'
    if (stationCodes.some(s => s.startsWith('CE'))) return 'CE'
    if (stationCodes.some(s => s.startsWith('DT'))) return 'DT'
    if (stationCodes.some(s => s.startsWith('TE'))) return 'TE'
    return null
}

function extractLineFeatures(geojson) {
    const result = {}

    geojson.features.forEach(feature => {
        if (
            feature.geometry.type !== 'LineString' &&
            feature.geometry.type !== 'MultiLineString'
        ) return

        const code = inferLineCode(feature)
        if (!code) return

        if (!result[code]) {
            result[code] = []
        }

        if (feature.geometry.type === 'LineString') {
            result[code].push({
                type: 'Feature',
                properties: feature.properties,
                geometry: {
                    type: 'LineString',
                    coordinates: feature.geometry.coordinates
                }
            })
        }

        if (feature.geometry.type === 'MultiLineString') {
            feature.geometry.coordinates.forEach(coords => {
                result[code].push({
                    type: 'Feature',
                    properties: feature.properties,
                    geometry: {
                        type: 'LineString',
                        coordinates: coords
                    }
                })
            })
        }
    })

    return result
}

function findBranchSplitIndex(mainCoords, branchCoords) {
    let splitIndex = 0
    let minDist = Infinity

    for (let i = 0; i < mainCoords.length; i += 1) {
        const dist = turf.distance(
            turf.point(mainCoords[i]),
            turf.point(branchCoords[0])
        )
        if (dist < minDist) {
            minDist = dist
            splitIndex = i
        }
    }

    return splitIndex
}

function orientBranchTowardMain(mainCoords, splitIndex, branchCoords) {
    const distStart = turf.distance(
        turf.point(mainCoords[splitIndex]),
        turf.point(branchCoords[0])
    )

    const distEnd = turf.distance(
        turf.point(mainCoords[splitIndex]),
        turf.point(branchCoords[branchCoords.length - 1])
    )

    if (distEnd < distStart) {
        branchCoords.reverse()
    }
}

function orientCcBranchTowardMain(mainCoords, branchCoords) {
    let splitIndex = 0
    let minDist = Infinity

    for (let i = 0; i < mainCoords.length; i += 1) {
        const d0 = turf.distance(turf.point(mainCoords[i]), turf.point(branchCoords[0]))
        const d1 = turf.distance(turf.point(mainCoords[i]), turf.point(branchCoords[branchCoords.length - 1]))
        const d = Math.min(d0, d1)
        if (d < minDist) {
            minDist = d
            splitIndex = i
        }
    }

    const dFirst = turf.distance(turf.point(mainCoords[splitIndex]), turf.point(branchCoords[0]))
    const dLast = turf.distance(turf.point(mainCoords[splitIndex]), turf.point(branchCoords[branchCoords.length - 1]))
    if (dLast < dFirst) {
        branchCoords.reverse()
    }

    return splitIndex
}

function buildRoutes(lineFeatures) {
    const routes = {}

    const ewMain = lineFeatures.EW?.[0]
    const ewBranch = lineFeatures.EW?.[1]
    const ccMain = lineFeatures.CC?.[0]
    const ccBranch = lineFeatures.CC?.[1]

    if (ewMain && ewBranch) {
        const mainCoords = ewMain.geometry.coordinates
        const branchCoords = [...ewBranch.geometry.coordinates]
        const splitIndex = findBranchSplitIndex(mainCoords, branchCoords)
        orientBranchTowardMain(mainCoords, splitIndex, branchCoords)

        const branchRouteCoords = [
            ...mainCoords.slice(0, splitIndex + 1),
            ...branchCoords.slice(1)
        ]

        const ewMainFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: mainCoords
            }
        }

        routes.EW_MAIN = {
            feature: ewMainFeature,
            length: turf.length(ewMainFeature)
        }

        const ewBranchFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: branchRouteCoords
            }
        }

        routes.EW_CG = {
            feature: ewBranchFeature,
            length: turf.length(ewBranchFeature),
            mainGeom: mainCoords.slice(0, splitIndex + 1),
            branchGeom: branchCoords
        }
    }

    if (ccMain && ccBranch) {
        const mainCoords = ccMain.geometry.coordinates
        const branchCoords = [...ccBranch.geometry.coordinates]
        const splitIndex = orientCcBranchTowardMain(mainCoords, branchCoords)
        const mainTail = mainCoords.slice(0, splitIndex + 1)
        const branchRouteCoords = [...mainTail, ...branchCoords]

        const ccMainFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: mainCoords
            }
        }

        routes.CC_MAIN = {
            feature: ccMainFeature,
            length: turf.length(ccMainFeature)
        }

        const ccBranchFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: branchRouteCoords
            }
        }

        routes.CC_CE = {
            feature: ccBranchFeature,
            length: turf.length(ccBranchFeature),
            mainGeom: mainTail,
            branchGeom: branchCoords
        }
    }

    Object.keys(lineFeatures).forEach(code => {
        if (code === 'EW' || code === 'CC') return

        const segments = lineFeatures[code]
        if (!segments?.length) return

        let feature
        if (segments.length > 1) {
            const remaining = segments.map(segment => segment.geometry.coordinates)
            const ordered = [remaining.shift()]

            while (remaining.length > 0) {
                const last = ordered[ordered.length - 1]
                const tail = last[last.length - 1]
                let bestIdx = 0
                let bestDist = Infinity

                for (let i = 0; i < remaining.length; i += 1) {
                    const d = turf.distance(turf.point(tail), turf.point(remaining[i][0]))
                    if (d < bestDist) {
                        bestDist = d
                        bestIdx = i
                    }
                }

                ordered.push(remaining.splice(bestIdx, 1)[0])
            }

            const allCoords = []
            ordered.forEach(seg => allCoords.push(...seg))
            feature = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: allCoords
                }
            }
        } else {
            feature = segments[0]
        }

        routes[code] = {
            feature,
            length: turf.length(feature)
        }
    })

    return routes
}

function getStationSequence(routeName) {
    if (routeName === 'EW_MAIN') {
        return (generatedLineSequences.EW || []).filter(code => !code.startsWith('CG'))
    }
    if (routeName === 'EW_CG') {
        return (generatedLineSequences.EW || []).filter(code => code !== 'EW4')
    }
    if (routeName === 'CC_MAIN') {
        return (generatedLineSequences.CC || []).filter(code => !code.startsWith('CE'))
    }
    if (routeName === 'CC_CE') {
        return generatedLineSequences.CC || []
    }
    if (lrtLineHubs[routeName]) {
        const sequence = generatedLineSequences[routeName] || []
        const hub = lrtLineHubs[routeName]
        return [hub, ...sequence, hub]
    }
    return generatedLineSequences[routeName] || []
}

function buildBranchStations(codes, geomCoords, branchCoords, allCoords) {
    const mainLine = turf.lineString(geomCoords)
    const mainLen = turf.length(mainLine)
    const branchLine = turf.lineString(branchCoords)
    const result = []

    codes.forEach(code => {
        const coord = allCoords[code]
        if (!coord) return

        const isBranchStation = code.startsWith('CG') || code.startsWith('CE')
        let dist = 0

        if (isBranchStation) {
            const snapped = turf.nearestPointOnLine(branchLine, turf.point(coord))
            const branchDist = snapped?.properties?.location || 0
            dist = mainLen + branchDist
        } else {
            const snapped = turf.nearestPointOnLine(mainLine, turf.point(coord))
            dist = snapped?.properties?.location || 0
        }

        result.push({ code, distance: dist })
    })

    return result
}

function buildStationsForSequence(sequence, lineFeature, routeLength, allStationCoords) {
    const stations = []

    sequence.forEach(code => {
        const stationCoord = allStationCoords[code]
        if (!stationCoord) return

        let minDist = Infinity
        let bestDistance = 0

        for (let i = 0; i <= 1000; i += 1) {
            const sampleDistance = routeLength * (i / 1000)
            const point = turf.along(lineFeature, sampleDistance)
            const d = turf.distance(
                turf.point(point.geometry.coordinates),
                turf.point(stationCoord)
            )

            if (d < minDist) {
                minDist = d
                bestDistance = sampleDistance
            }
        }

        if (minDist < 0.5) {
            stations.push({ code, distance: bestDistance })
        }
    })

    return stations
}

function isIncreasingByDistance(stations) {
    for (let i = 1; i < stations.length; i += 1) {
        if (stations[i].distance < stations[i - 1].distance) {
            return false
        }
    }
    return true
}

function dedupeStations(stations) {
    const deduped = []
    const used = new Set()

    stations.forEach(station => {
        if (used.has(station.code)) return
        used.add(station.code)
        deduped.push(station)
    })

    return deduped
}

function buildRouteStations(geojson, routes) {
    const routeStations = {}
    const allStationCoords = {}

    geojson.features.forEach(feature => {
        if (
            feature.geometry.type === 'Point' &&
            feature.properties.station_codes &&
            feature.properties.stop_type !== 'entrance'
        ) {
            feature.properties.station_codes.split('-').forEach(code => {
                allStationCoords[code] = feature.geometry.coordinates
            })
        }
    })

    Object.entries(routes).forEach(([routeName, route]) => {
        const coords = route.feature.geometry.coordinates
        const lineFeature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: coords
            }
        }

        const sequence = getStationSequence(routeName)

        if (routeName === 'EW_CG') {
            const mainPart = sequence.filter(code => !code.startsWith('CG'))
            const ew5Idx = mainPart.indexOf('EW5')
            const branchCodes = ['CG', 'CG1', 'CG2']
            const codes = [...mainPart.slice(ew5Idx).reverse(), ...branchCodes]
            routeStations[routeName] = buildBranchStations(
                codes,
                route.mainGeom,
                route.branchGeom,
                allStationCoords
            )
            return
        }

        if (routeName === 'CC_CE') {
            const mainPart = sequence.filter(code => !code.startsWith('CE'))
            const cc4Idx = mainPart.indexOf('CC4')
            const codes = [...mainPart.slice(cc4Idx).reverse(), 'CE1', 'CE2']
            routeStations[routeName] = buildBranchStations(
                codes,
                route.mainGeom,
                route.branchGeom,
                allStationCoords
            )
            return
        }

        const normalStations = buildStationsForSequence(sequence, lineFeature, route.length, allStationCoords)
        const reversedStations = isIncreasingByDistance(normalStations)
            ? normalStations
            : buildStationsForSequence([...sequence].reverse(), lineFeature, route.length, allStationCoords)

        reversedStations.sort((a, b) => a.distance - b.distance)
        const deduped = dedupeStations(reversedStations)

        if (deduped.length >= 2) {
            const first = deduped[0].distance
            const last = deduped[deduped.length - 1].distance
            if (first > last) {
                deduped.reverse()
            }
        }

        routeStations[routeName] = deduped
    })

    return {
        routeStations,
        stationCoords: allStationCoords
    }
}

export function buildTrainRouteNetwork(geojson) {
    const lineFeatures = extractLineFeatures(geojson)
    const routes = buildRoutes(lineFeatures)
    const { routeStations, stationCoords } = buildRouteStations(geojson, routes)

    return {
        lineFeatures,
        routes,
        routeStations,
        stationCoords
    }
}

export function findNearestStationCode(stationCoords, coords, threshold = 0.002) {
    let nearest = null
    let minDist = Infinity

    Object.entries(stationCoords || {}).forEach(([code, stationCoord]) => {
        const dist = Math.abs(coords[0] - stationCoord[0]) + Math.abs(coords[1] - stationCoord[1])
        if (dist < minDist && dist < threshold) {
            minDist = dist
            nearest = code
        }
    })

    return nearest
}
