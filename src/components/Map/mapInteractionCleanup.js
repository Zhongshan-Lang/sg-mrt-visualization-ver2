import { STATION_INTERACTION_LAYERS } from './stationInteractions'

const INTERACTION_EVENTS = ['mouseenter', 'mouseleave', 'click', 'mousemove']

export function clearMapInteractionBindings(map) {
    INTERACTION_EVENTS.forEach(event => {
        STATION_INTERACTION_LAYERS.forEach(layerId => map.off(event, layerId))
        map.off(event, 'mrt-line-layer')
    })
}

export function clearMapClickBinding(map, mapClickHandlerRef) {
    if (!mapClickHandlerRef.current) return
    map.off('click', mapClickHandlerRef.current)
    mapClickHandlerRef.current = null
}
