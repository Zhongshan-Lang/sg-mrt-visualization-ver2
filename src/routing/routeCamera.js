import * as turf from '@turf/turf'

let routeCameraTimer = null
const ROUTE_FIT_DURATION = 1250
const ROUTE_PITCH_DURATION = 1300
const ROUTE_PITCH_DELAY = ROUTE_FIT_DURATION + 120

export function choreographRouteCamera(mapRef, routeFeatures = []) {
    const map = mapRef?.current
    if (!map || routeFeatures.length === 0) return

    if (routeCameraTimer) {
        clearTimeout(routeCameraTimer)
        routeCameraTimer = null
    }

    const lineFeatures = routeFeatures.filter(feature =>
        feature.geometry?.type === 'LineString' &&
        feature.geometry.coordinates.length > 1
    )
    if (lineFeatures.length === 0) return

    const collection = { type: 'FeatureCollection', features: lineFeatures }
    const bounds = turf.bbox(collection)
    if (!bounds.every(Number.isFinite)) return

    const allCoords = lineFeatures.flatMap(feature => feature.geometry.coordinates)
    const firstCoord = allCoords[0]
    const lastCoord = allCoords[allCoords.length - 1]
    const routeBearing = getRouteBearing(firstCoord, lastCoord)
    const currentBearing = map.getBearing()
    const finalBearing = Number.isFinite(routeBearing)
        ? currentBearing + shortestBearingDelta(currentBearing, routeBearing) * 0.32
        : currentBearing

    const padding = getRouteCameraPadding()
    const fitBounds = [[bounds[0], bounds[1]], [bounds[2], bounds[3]]]

    map.fitBounds(fitBounds, {
        padding,
        maxZoom: 15.8,
        pitch: 8,
        bearing: currentBearing,
        duration: ROUTE_FIT_DURATION,
        essential: true,
        easing: easeOutCubic
    })

    routeCameraTimer = setTimeout(() => {
        if (!mapRef?.current) return
        map.easeTo({
            bearing: finalBearing,
            pitch: 34,
            duration: ROUTE_PITCH_DURATION,
            essential: true,
            easing: easeOutCubic
        })
        routeCameraTimer = null
    }, ROUTE_PITCH_DELAY)
}

export function clearRouteCameraChoreography() {
    if (!routeCameraTimer) return
    clearTimeout(routeCameraTimer)
    routeCameraTimer = null
}

function getRouteCameraPadding() {
    const wide = typeof window !== 'undefined' && window.innerWidth >= 760
    return {
        top: 110,
        bottom: 90,
        left: wide ? 430 : 90,
        right: 90
    }
}

function getRouteBearing(firstCoord, lastCoord) {
    if (!firstCoord || !lastCoord) return null
    if (turf.distance(turf.point(firstCoord), turf.point(lastCoord), { units: 'kilometers' }) < 0.08) {
        return null
    }
    return turf.bearing(turf.point(firstCoord), turf.point(lastCoord))
}

function shortestBearingDelta(from, to) {
    return ((((to - from) % 360) + 540) % 360) - 180
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
}
