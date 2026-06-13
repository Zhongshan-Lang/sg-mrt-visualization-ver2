import { buildRouteFeatures } from './routeGeometry'
import * as turf from '@turf/turf'

let glowTimer = null
let flowTimer = null

export function createRouteHighlight(mapRef, routeResult, mrtData) {
    if (!mapRef?.current || !routeResult) return

    const features = buildRouteFeatures(routeResult, mrtData)
    if (features.length === 0) return

    const srcId = 'route-highlight-src'
    mapRef.current.getSource(srcId)?.setData({ type: 'FeatureCollection', features })
    if (mapRef.current.getLayer('route-glow')) {
        mapRef.current.setPaintProperty('route-glow', 'line-opacity', 0.25)
    }
    if (mapRef.current.getLayer('route-highlight-layer')) {
        mapRef.current.setPaintProperty('route-highlight-layer', 'line-opacity', 0.9)
    }
    startGlowPulse(mapRef.current)
    startRouteFlow(mapRef.current, features)

    if (mapRef.current.getLayer('mrt-line-layer')) {
        mapRef.current.setPaintProperty('mrt-line-layer', 'line-opacity', 0.15)
    }

    return features
}

export function clearRouteHighlight(mapRef) {
    if (!mapRef?.current) return
    if (glowTimer) { clearInterval(glowTimer); glowTimer = null }
    if (flowTimer) { clearInterval(flowTimer); flowTimer = null }
    mapRef.current.getSource('route-highlight-src')?.setData({ type: 'FeatureCollection', features: [] })
    mapRef.current.getSource('route-flow-src')?.setData({ type: 'FeatureCollection', features: [] })
    if (mapRef.current.getLayer('route-glow')) {
        mapRef.current.setPaintProperty('route-glow', 'line-opacity', 0)
    }
    if (mapRef.current.getLayer('route-highlight-layer')) {
        mapRef.current.setPaintProperty('route-highlight-layer', 'line-opacity', 0)
    }
    if (mapRef.current.getLayer('route-flow-layer')) {
        mapRef.current.setPaintProperty('route-flow-layer', 'line-opacity', 0)
    }
    if (mapRef.current.getLayer('mrt-line-layer')) {
        mapRef.current.setPaintProperty('mrt-line-layer', 'line-opacity', 1)
    }
}

function startGlowPulse(map) {
    if (glowTimer) clearInterval(glowTimer)
    let up = true
    let val = 0.2
    glowTimer = setInterval(() => {
        if (!map.getLayer('route-glow')) { clearInterval(glowTimer); glowTimer = null; return }
        val += up ? 0.015 : -0.015
        if (val >= 0.4) up = false
        if (val <= 0.15) up = true
        map.setPaintProperty('route-glow', 'line-opacity', val)
    }, 200)
}

function startRouteFlow(map, routeFeatures) {
    if (flowTimer) clearInterval(flowTimer)

    const segments = routeFeatures
        .filter(feature => feature.geometry?.type === 'LineString' && feature.geometry.coordinates.length > 1)
        .map(feature => ({
            feature,
            length: turf.length(feature, { units: 'kilometers' }),
            color: feature.properties?.color || '#ffffff'
        }))
        .filter(segment => segment.length > 0.02)

    const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0)
    if (segments.length === 0 || totalLength <= 0) return

    if (map.getLayer('route-flow-layer')) {
        map.setPaintProperty('route-flow-layer', 'line-opacity', 0.55)
    }

    let offset = 0
    const dashLength = Math.max(0.035, Math.min(0.095, totalLength / 30))
    const gapLength = dashLength * 1.8
    const period = dashLength + gapLength
    const speed = Math.max(0.012, Math.min(0.04, totalLength / 300))

    const renderFrame = () => {
        if (!map.getLayer('route-flow-layer') || !map.getSource('route-flow-src')) {
            clearInterval(flowTimer)
            flowTimer = null
            return
        }

        const features = []
        for (let cursor = offset - period; cursor < totalLength; cursor += period) {
            appendDash(features, segments, Math.max(0, cursor), Math.min(totalLength, cursor + dashLength))
        }

        map.getSource('route-flow-src').setData({ type: 'FeatureCollection', features })
        offset = (offset + speed) % period
    }

    renderFrame()
    flowTimer = setInterval(renderFrame, 110)
}

function appendDash(output, segments, globalStart, globalEnd) {
    if (globalEnd <= globalStart) return

    let travelled = 0
    for (const segment of segments) {
        const segmentStart = travelled
        const segmentEnd = travelled + segment.length
        travelled = segmentEnd

        if (globalEnd <= segmentStart) break
        if (globalStart >= segmentEnd) continue

        const localStart = Math.max(0, globalStart - segmentStart)
        const localEnd = Math.min(segment.length, globalEnd - segmentStart)
        if (localEnd <= localStart) continue

        try {
            const slice = turf.lineSliceAlong(segment.feature, localStart, localEnd, { units: 'kilometers' })
            if (slice.geometry.coordinates.length > 1) {
                output.push({
                    type: 'Feature',
                    geometry: slice.geometry,
                    properties: { color: segment.color }
                })
            }
        } catch {
            // Ignore invalid partial slices and continue assembling the highlight.
        }
    }
}
