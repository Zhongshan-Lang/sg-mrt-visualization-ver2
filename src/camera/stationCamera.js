const STATION_PANEL_OFFSET = -155
const MOBILE_BREAKPOINT = 760

export function focusStationCamera(map, coordinates, options = {}) {
    if (!map || !Array.isArray(coordinates)) return

    const currentZoom = map.getZoom()
    const zoom = options.zoom ?? clamp(currentZoom < 15.8 ? 16.8 : currentZoom, 16.2, 17.25)

    map.easeTo({
        center: coordinates,
        zoom,
        pitch: options.pitch ?? 38,
        bearing: options.bearing ?? map.getBearing(),
        offset: getStationCameraOffset(),
        duration: options.duration ?? 1050,
        essential: true,
        easing: easeOutCubic
    })
}

export function focusEntranceCamera(map, coordinates) {
    if (!map || !Array.isArray(coordinates)) return

    map.easeTo({
        center: coordinates,
        zoom: 18,
        pitch: 32,
        bearing: map.getBearing(),
        offset: getStationCameraOffset(),
        duration: 950,
        essential: true,
        easing: easeOutCubic
    })
}

function getStationCameraOffset() {
    const wide = typeof window !== 'undefined' && window.innerWidth >= MOBILE_BREAKPOINT
    return wide ? [STATION_PANEL_OFFSET, 0] : [0, 0]
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3)
}
