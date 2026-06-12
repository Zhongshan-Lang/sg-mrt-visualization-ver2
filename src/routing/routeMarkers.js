import maplibregl from 'maplibre-gl'

export function createRouteMarkers(mapRef, navStart, navEnd, mrtData) {
    clearRouteMarkers()

    const startFeature = findStationFeature(navStart, mrtData)
    const endFeature = findStationFeature(navEnd, mrtData)

    if (startFeature) {
        createPulsingMarker(mapRef, startFeature.geometry.coordinates, '#00ff88')
    }

    if (endFeature) {
        createPulsingMarker(mapRef, endFeature.geometry.coordinates, '#ff4444')
    }

    if (startFeature && endFeature && mapRef.current) {
        const bounds = new maplibregl.LngLatBounds()
        bounds.extend(startFeature.geometry.coordinates)
        bounds.extend(endFeature.geometry.coordinates)
        mapRef.current.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 420, right: 100 },
            maxZoom: 14,
            duration: 1500
        })
    }
}

export function clearRouteMarkers() {
    if (window.__routeMarkers) {
        window.__routeMarkers.forEach(m => m.remove())
        window.__routeMarkers = []
    }
    if (window.__routeIntervals) {
        window.__routeIntervals.forEach(clearInterval)
        window.__routeIntervals = []
    }
}

function findStationFeature(stationCode, mrtData) {
    return mrtData.features.find(f =>
        f.geometry.type === 'Point' &&
        f.properties.stop_type !== 'entrance' &&
        f.properties.type !== 'subway' &&
        (f.properties.station_codes || '').split('-').includes(stationCode)
    )
}

function createPulsingMarker(mapRef, coordinates, color) {
    const marker = new maplibregl.Marker({ color, scale: 0.8 })
        .setLngLat(coordinates)
        .addTo(mapRef.current)
    window.__routeMarkers = [...(window.__routeMarkers || []), marker]

    const el = marker.getElement()
    let scale = 1
    let dir = -1
    const interval = setInterval(() => {
        scale += dir * 0.025
        if (scale <= 0.3) dir = 1
        if (scale >= 1) dir = -1
        el.style.opacity = scale
    }, 30)
    window.__routeIntervals = [...(window.__routeIntervals || []), interval]
}
