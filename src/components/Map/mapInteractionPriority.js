import { STATION_INTERACTION_LAYERS } from './stationInteractions'

const LINE_INTERACTION_LAYERS = ['mrt-line-layer']

export function getStationFeaturesAtPoint(map, point) {
    return map.queryRenderedFeatures(point, { layers: STATION_INTERACTION_LAYERS })
}

export function getLineFeaturesAtPoint(map, point) {
    return map.queryRenderedFeatures(point, { layers: LINE_INTERACTION_LAYERS })
}

export function hasStationFeatureAtPoint(map, point) {
    return getStationFeaturesAtPoint(map, point).length > 0
}

export function hasLineFeatureAtPoint(map, point) {
    return getLineFeaturesAtPoint(map, point).length > 0
}

export function shouldClosePanelsForMapClick(map, point) {
    return !hasStationFeatureAtPoint(map, point) && !hasLineFeatureAtPoint(map, point)
}
