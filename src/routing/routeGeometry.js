import * as turf from '@turf/turf'
import { lineColors, stationLineToActualCode } from '../config'
import { LRT_LINES, PE_LINE, PE_LOWER_TERMINAL, PE_UPPER_TERMINAL, PTC_CODE } from './specialLineRules'

/**
 * Build GeoJSON features for the route highlight.
 * Exported so routeAnimation can reuse the correctly-sliced geometries.
 */
export function buildRouteFeatures(routeResult, mrtData) {
    if (!routeResult) return []

    const features = []
    routeResult.forEach(seg => {
        const actualCode = stationLineToActualCode[seg.line] || seg.line
        const fullLine = mrtData.features.find(f =>
            (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString') &&
            f.properties.code === actualCode
        )
        if (!fullLine || seg.stations.length < 2) return

        const getStnCoord = (code) => {
            const f = mrtData.features.find(f =>
                f.geometry.type === 'Point' && f.properties.stop_type !== 'entrance' &&
                f.properties.type !== 'subway' &&
                (f.properties.station_codes || '').split('-').includes(code)
            )
            return f ? f.geometry.coordinates : null
        }

        const getLineGeom = (hasBranch) => {
            if (fullLine.geometry.type === 'MultiLineString') {
                const segs = fullLine.geometry.coordinates
                return hasBranch ? segs[segs.length - 1] : segs[0]
            }
            return fullLine.geometry.coordinates
        }

        const stns = seg.stations
        const hasBranch = stns.some(s => s.startsWith('CG') || s.startsWith('CE'))
        const pushFallbackStationPath = () => {
            const coords = stns.map(getStnCoord).filter(Boolean)
            if (coords.length < 2) return
            features.push({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: coords },
                properties: { color: lineColors[actualCode] || '#fff' }
            })
        }

const trySliceBothWays = (a, b, geom) => {
            if (!a || !b) return null
            if (turf.distance(turf.point(a), turf.point(b)) < 0.05) return null
            const line = turf.lineString(geom)
            const totalLength = turf.length(line)
            const isClosedLoop = geom.length > 2 &&
                turf.distance(turf.point(geom[0]), turf.point(geom[geom.length - 1]), { units: 'kilometers' }) < 0.15
            const maxSnapDistanceKm = 0.4
            const startSnap = turf.nearestPointOnLine(line, turf.point(a), { units: 'kilometers' })
            const endSnap = turf.nearestPointOnLine(line, turf.point(b), { units: 'kilometers' })
            if ((startSnap.properties.dist ?? Infinity) > maxSnapDistanceKm ||
                (endSnap.properties.dist ?? Infinity) > maxSnapDistanceKm) {
                return null
            }
            const revLine = turf.lineString([...geom].reverse())
            try {
                const fwd = turf.lineSlice(turf.point(a), turf.point(b), line)
                const rev = turf.lineSlice(turf.point(a), turf.point(b), revLine)
                const candidates = [fwd, rev]
                    .filter(Boolean)
                    .map(slice => ({ slice, length: turf.length(slice) }))
                    .filter(({ slice, length }) =>
                        slice.geometry.coordinates.length > 1 &&
                        length > 0.02 &&
                        (!isClosedLoop || length < totalLength - 0.02)
                    )
                    .sort((a, b) => a.length - b.length)

                if (candidates.length > 0) return orientSlice(candidates[0].slice, a, b)
            } catch {
                // Ignore slice failures and fall back to the next geometry candidate.
            }
            return null
        }

        const pushStationPairFeature = (fromCode, toCode, forceFallback = false) => {
            const a = getStnCoord(fromCode)
            const b = getStnCoord(toCode)
            if (!a || !b) return

            if (!forceFallback) {
                const geoms = fullLine.geometry.type === 'MultiLineString'
                    ? fullLine.geometry.coordinates
                    : [getLineGeom(hasBranch)]
                let bestSlice = null
                let bestLength = Infinity
                geoms.forEach(geom => {
                    const s = trySliceBothWays(a, b, geom)
                    if (!s) return
                    const len = turf.length(s)
                    if (len < bestLength) {
                        bestSlice = s
                        bestLength = len
                    }
                })
                if (bestSlice && bestSlice.geometry.coordinates.length > 1) {
                    features.push({
                        type: 'Feature',
                        geometry: bestSlice.geometry,
                        properties: { color: lineColors[actualCode] || '#fff' }
                    })
                    return
                }
            }

            features.push({
                type: 'Feature',
                geometry: { type: 'LineString', coordinates: [a, b] },
                properties: { color: lineColors[actualCode] || '#fff' }
            })
        }

        const pushSliceFeature = (slice) => {
            if (!slice || slice.geometry.coordinates.length < 2) return false
            features.push({
                type: 'Feature',
                geometry: slice.geometry,
                properties: { color: lineColors[actualCode] || '#fff' }
            })
            return true
        }

        const pushPEPairFeature = (fromCode, toCode) => {
            if (fullLine.geometry.type !== 'MultiLineString') {
                pushStationPairFeature(fromCode, toCode)
                return
            }

            const [upperConnector, mainLoop, lowerConnector] = fullLine.geometry.coordinates
            const a = getStnCoord(fromCode)
            const b = getStnCoord(toCode)
            if (!a || !b || !upperConnector || !mainLoop || !lowerConnector) return

            const upperJunction = upperConnector[0]
            const lowerJunction = lowerConnector[lowerConnector.length - 1]

            const pushGeomSlice = (start, end, geom) => pushSliceFeature(trySliceBothWays(start, end, geom))

            if ((fromCode === PTC_CODE && toCode === PE_UPPER_TERMINAL) || (fromCode === PE_UPPER_TERMINAL && toCode === PTC_CODE)) {
                const station = fromCode === PE_UPPER_TERMINAL ? a : b
                pushGeomSlice(getStnCoord(PTC_CODE), upperJunction, upperConnector)
                pushGeomSlice(upperJunction, station, mainLoop)
                return
            }

            if ((fromCode === PTC_CODE && toCode === PE_LOWER_TERMINAL) || (fromCode === PE_LOWER_TERMINAL && toCode === PTC_CODE)) {
                const station = fromCode === PE_LOWER_TERMINAL ? a : b
                pushGeomSlice(getStnCoord(PTC_CODE), lowerConnector[0], upperConnector)
                pushGeomSlice(lowerConnector[0], lowerJunction, lowerConnector)
                pushGeomSlice(lowerJunction, station, mainLoop)
                return
            }

            if (fromCode.startsWith('PE') && toCode.startsWith('PE')) {
                if (!pushGeomSlice(a, b, mainLoop)) pushStationPairFeature(fromCode, toCode)
                return
            }

            pushStationPairFeature(fromCode, toCode)
        }

        if (LRT_LINES.includes(actualCode)) {
            for (let i = 0; i < stns.length - 1; i++) {
                const from = stns[i]
                const to = stns[i + 1]
                if (actualCode === PE_LINE) {
                    pushPEPairFeature(from, to)
                } else {
                    pushStationPairFeature(from, to)
                }
            }
            return
        }

        const isCG = actualCode === 'EW' && stns.some(s => s.startsWith('CG'))
        if (isCG && !stns.every(s => s.startsWith('CG'))) {
            const brStart = stns.findIndex(s => s.startsWith('CG'))
            const brEnd = stns.findLastIndex(s => s.startsWith('CG'))
            if (brStart > 0) {
                const s = trySliceBothWays(getStnCoord(stns[0]), getStnCoord(stns[brStart]), getLineGeom(false))
                if (s) features.push({ type: 'Feature', geometry: s.geometry, properties: { color: lineColors['EW'] || '#fff' } })
            }
            if (brEnd > brStart) {
                const s = trySliceBothWays(getStnCoord(stns[brStart]), getStnCoord(stns[brEnd]), getLineGeom(true))
                if (s) features.push({ type: 'Feature', geometry: s.geometry, properties: { color: lineColors['EW'] || '#fff' } })
            }
            if (brEnd < stns.length - 1) {
                const s = trySliceBothWays(getStnCoord(stns[brEnd]), getStnCoord(stns[stns.length - 1]), getLineGeom(false))
                if (s) features.push({ type: 'Feature', geometry: s.geometry, properties: { color: lineColors['EW'] || '#fff' } })
            }
        } else if (actualCode === 'CC' && stns.some(s => s.startsWith('CE')) && !stns.every(s => s.startsWith('CE'))) {
            const brStart = stns.findIndex(s => s.startsWith('CE'))
            const brEnd = stns.findLastIndex(s => s.startsWith('CE'))
            if (stns.length === 2) {
                const s = trySliceBothWays(getStnCoord(stns[0]), getStnCoord(stns[1]), getLineGeom(true))
                if (s) features.push({ type: 'Feature', geometry: s.geometry, properties: { color: lineColors['CC'] || '#fff' } })
            } else {
                if (brStart > 0) {
                    const s = trySliceBothWays(getStnCoord(stns[0]), getStnCoord(stns[brStart - 1]), getLineGeom(false))
                    if (s) features.push({ type: 'Feature', geometry: s.geometry, properties: { color: lineColors['CC'] || '#fff' } })
                }
                if (brStart > 0) {
                    const s = trySliceBothWays(getStnCoord(stns[brStart - 1]), getStnCoord(stns[brStart]), getLineGeom(true))
                    if (s) features.push({ type: 'Feature', geometry: s.geometry, properties: { color: lineColors['CC'] || '#fff' } })
                }
                if (brEnd > brStart) {
                    const s = trySliceBothWays(getStnCoord(stns[brStart]), getStnCoord(stns[brEnd]), getLineGeom(true))
                    if (s) features.push({ type: 'Feature', geometry: s.geometry, properties: { color: lineColors['CC'] || '#fff' } })
                }
                if (brEnd < stns.length - 1) {
                    const s = trySliceBothWays(getStnCoord(stns[brEnd]), getStnCoord(stns[brEnd + 1]), getLineGeom(true))
                    if (s) features.push({ type: 'Feature', geometry: s.geometry, properties: { color: lineColors['CC'] || '#fff' } })
                }
                if (brEnd < stns.length - 2) {
                    const s = trySliceBothWays(getStnCoord(stns[brEnd + 1]), getStnCoord(stns[stns.length - 1]), getLineGeom(false))
                    if (s) features.push({ type: 'Feature', geometry: s.geometry, properties: { color: lineColors['CC'] || '#fff' } })
                }
            }
        } else {
            const a = getStnCoord(stns[0])
            const b = getStnCoord(stns[stns.length - 1])
            if (a && b) {
                const geoms = fullLine.geometry.type === 'MultiLineString'
                    ? fullLine.geometry.coordinates
                    : [getLineGeom(hasBranch)]
                let bestSlice = null
                let bestLength = Infinity
                geoms.forEach(geom => {
                    const s = trySliceBothWays(a, b, geom)
                    if (!s) return
                    const len = turf.length(s)
                    if (len < bestLength) {
                        bestSlice = s
                        bestLength = len
                    }
                })
                if (bestSlice && bestSlice.geometry.coordinates.length > 1) {
                    features.push({
                        type: 'Feature', geometry: bestSlice.geometry,
                        properties: { color: lineColors[actualCode] || '#fff' }
                    })
                } else {
                    pushFallbackStationPath()
                }
            }
        }
    })

    return features
}

function orientSlice(slice, fromCoord, toCoord) {
    const coords = slice?.geometry?.coordinates
    if (!coords || coords.length < 2) return slice

    const first = coords[0]
    const last = coords[coords.length - 1]
    const forwardScore =
        turf.distance(turf.point(first), turf.point(fromCoord), { units: 'kilometers' }) +
        turf.distance(turf.point(last), turf.point(toCoord), { units: 'kilometers' })
    const reverseScore =
        turf.distance(turf.point(last), turf.point(fromCoord), { units: 'kilometers' }) +
        turf.distance(turf.point(first), turf.point(toCoord), { units: 'kilometers' })

    if (reverseScore < forwardScore) {
        return {
            ...slice,
            geometry: {
                ...slice.geometry,
                coordinates: [...coords].reverse()
            }
        }
    }

    return slice
}
