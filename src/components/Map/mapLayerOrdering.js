export const MRT_NETWORK_LAYER_IDS = [
    'station-interior', 'station-interior-outline', 'mrt-line-layer', 'mrt-line-hover', 'mrt-line-glow',
    'route-highlight-layer', 'route-flow-layer', 'route-glow',
    'station-glow', 'station-core', 'station-glow-local', 'station-core-local', 'station-labels',
    'station-entrance', 'entrance-labels'
]

const MRT_LAYER_IDS = new Set(MRT_NETWORK_LAYER_IDS)

const STATION_LAYER_IDS = [
    'station-glow', 'station-core', 'station-glow-local', 'station-core-local', 'station-labels',
    'station-entrance', 'entrance-labels'
]

export function findBuildingLayer(map) {
    if (!map) return null
    const layers = map.getStyle().layers
    if (!layers) return null
    for (const layer of layers) {
        if (layer.type === 'fill-extrusion' && layer.id.toLowerCase().includes('build')) {
            return layer.id
        }
    }
    for (const layer of layers) {
        if (layer.type === 'fill-extrusion' && layer.source?.toLowerCase().includes('openmaptiles')) {
            return layer.id
        }
    }
    return null
}

export function moveLabelsAboveBuilding(map) {
    if (!map) return
    const layers = map.getStyle().layers
    if (!layers) return
    for (const layer of layers) {
        if (layer.type === 'symbol' && !MRT_LAYER_IDS.has(layer.id)) {
            if (map.getLayer(layer.id)) {
                map.moveLayer(layer.id)
            }
        }
    }
}

export function moveStationLayersToTop(map) {
    if (!map) return
    STATION_LAYER_IDS.forEach(id => {
        if (map.getLayer(id)) {
            map.moveLayer(id)
        }
    })
}

export function configureBuildingLayer(map, showBuildings) {
    const buildingLayerId = findBuildingLayer(map)
    if (!buildingLayerId) return

    map.setPaintProperty(buildingLayerId, 'fill-extrusion-opacity',
        ['interpolate', ['linear'], ['zoom'],
            15, 0.95,
            16, 0.80,
            17, 0.55,
            18, 0.40])
    map.setLayoutProperty(buildingLayerId, 'visibility', showBuildings ? 'visible' : 'none')
    map.moveLayer(buildingLayerId)
    moveLabelsAboveBuilding(map)
    moveStationLayersToTop(map)
}

export function setMrtNetworkLayerVisibility(map, visible) {
    if (!map) return

    const visibility = visible ? 'visible' : 'none'
    MRT_NETWORK_LAYER_IDS.forEach(id => {
        if (map.getLayer(id)) {
            map.setLayoutProperty(id, 'visibility', visibility)
        }
    })
    map.triggerRepaint?.()
}
