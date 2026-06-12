let routeUtilsPromise = null

export function loadRouteUtils() {
    routeUtilsPromise ||= import('./routeUtils')
    return routeUtilsPromise
}
