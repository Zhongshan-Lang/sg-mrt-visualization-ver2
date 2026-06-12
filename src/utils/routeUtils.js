import { findRoute, findRouteDijkstra, findRouteFewestTransfers } from '../routing/navigationUtils'
export { buildRouteFeatures } from '../routing/routeGeometry'
export { createRouteHighlight, clearRouteHighlight } from '../routing/routeHighlight'
export { createRouteMarkers, clearRouteMarkers } from '../routing/routeMarkers'
export { choreographRouteCamera, clearRouteCameraChoreography } from '../routing/routeCamera'

export function calculateRoute(navStart, navEnd, algorithm = 'bfs', mrtData) {
    if (!navStart || !navEnd) return null
    if (algorithm === 'dijkstra') {
        return findRouteDijkstra(navStart, navEnd, mrtData)
    }
    if (algorithm === 'fewest-transfers') {
        return findRouteFewestTransfers(navStart, navEnd, mrtData)
    }
    return findRoute(navStart, navEnd, mrtData)
}
