import { useCallback, useRef, useState } from 'react'
import { loadRouteUtils } from '../utils/routeModule'

export function useRouteNavigation({
    mapRef,
    mrtData,
    setSelectedLines,
    setHoveredLines,
    setShowNavigation,
    setIsNavClosing
}) {
    const routeResultRef = useRef(null)

    const [navStart, setNavStart] = useState(null)
    const [navEnd, setNavEnd] = useState(null)
    const [navStartQuery, setNavStartQuery] = useState('')
    const [navEndQuery, setNavEndQuery] = useState('')
    const [routeResult, setRouteResult] = useState(null)
    const [showRoutePanel, setShowRoutePanel] = useState(false)
    const [routeLines, setRouteLines] = useState([])
    const [isRoutePanelClosing, setIsRoutePanelClosing] = useState(false)
    const [algorithm, setAlgorithm] = useState('bfs')
    const clearNavigation = useCallback(() => {
        setNavStart(null)
        setNavEnd(null)
        setNavStartQuery('')
        setNavEndQuery('')
        setRouteResult(null)
        routeResultRef.current = null
        loadRouteUtils().then(({ clearRouteHighlight, clearRouteCameraChoreography }) => {
            clearRouteCameraChoreography()
            clearRouteHighlight(mapRef)
        })
    }, [mapRef])

    const handleCalculateRoute = useCallback(async () => {
        if (!navStart || !navEnd || !mrtData?.features) return
        const {
            calculateRoute,
            createRouteMarkers,
            createRouteHighlight,
            choreographRouteCamera
        } = await loadRouteUtils()
        let effectiveStart = navStart
        const route = calculateRoute(navStart, navEnd, algorithm, mrtData)

        const firstSeg = route?.[0]
        if (firstSeg && firstSeg.stations.length > 0) {
            const firstStn = firstSeg.stations[0]
            const feature = mrtData.features.find(f =>
                f.geometry.type === 'Point' &&
                f.properties.stop_type !== 'entrance' &&
                f.properties.type !== 'subway' &&
                (f.properties.station_codes || '').split('-').includes(firstStn)
            )
            if (feature) {
                const codes = (feature.properties.station_codes || '').split('-')
                const matched = codes.find(c => (c.match(/^[A-Z]+/)?.[0] || '') === firstSeg.line)
                if (matched) effectiveStart = matched
            }
        }

        setRouteResult(route)
        routeResultRef.current = route
        setShowRoutePanel(true)
        setRouteLines([...new Set(route.map(seg => seg.line))])

        createRouteMarkers(mapRef, effectiveStart, navEnd, mrtData)
        const routeFeatures = createRouteHighlight(mapRef, route, mrtData)
        choreographRouteCamera(mapRef, routeFeatures)

        setIsNavClosing(true)
        setTimeout(() => {
            setShowNavigation(false)
            setIsNavClosing(false)
        }, 200)
    }, [algorithm, mapRef, mrtData, navEnd, navStart, setIsNavClosing, setShowNavigation])

    const swapNavStations = useCallback(() => {
        setNavStart(navEnd)
        setNavEnd(navStart)
        setNavStartQuery(navEndQuery)
        setNavEndQuery(navStartQuery)
        setRouteResult(null)
        routeResultRef.current = null
        setRouteLines([])
        loadRouteUtils().then(({ clearRouteMarkers, clearRouteHighlight, clearRouteCameraChoreography }) => {
            clearRouteCameraChoreography()
            clearRouteMarkers()
            clearRouteHighlight(mapRef)
        })
    }, [mapRef, navEnd, navEndQuery, navStart, navStartQuery])

    const handleAlgorithmSwitch = useCallback(async (newAlgorithm) => {
        if (newAlgorithm === algorithm || !navStart || !navEnd || !mrtData?.features) return
        const { calculateRoute, createRouteHighlight, choreographRouteCamera } = await loadRouteUtils()
        setAlgorithm(newAlgorithm)
        const route = calculateRoute(navStart, navEnd, newAlgorithm, mrtData)
        if (!route) return
        setRouteResult(route)
        routeResultRef.current = route
        setRouteLines([...new Set(route.map(seg => seg.line))])
        const routeFeatures = createRouteHighlight(mapRef, route, mrtData)
        choreographRouteCamera(mapRef, routeFeatures)
    }, [algorithm, mapRef, mrtData, navEnd, navStart])

    const handleCloseRoutePanel = useCallback(() => {
        setIsRoutePanelClosing(true)
        setTimeout(() => {
            setShowRoutePanel(false)
            setRouteResult(null)
            routeResultRef.current = null
            setRouteLines([])
            setSelectedLines([])
            setHoveredLines([])
            setIsRoutePanelClosing(false)
            clearNavigation()
            loadRouteUtils().then(({ clearRouteMarkers, clearRouteHighlight, clearRouteCameraChoreography }) => {
                clearRouteCameraChoreography()
                clearRouteMarkers()
                clearRouteHighlight(mapRef)
            })
        }, 350)
    }, [clearNavigation, mapRef, setHoveredLines, setSelectedLines])

    const clearRouteForTrainSelection = useCallback(() => {
        setShowRoutePanel(false)
        setRouteResult(null)
        routeResultRef.current = null
        setRouteLines([])
        setSelectedLines([])
        setHoveredLines([])
        loadRouteUtils().then(({ clearRouteHighlight, clearRouteCameraChoreography }) => {
            clearRouteCameraChoreography()
            clearRouteHighlight(mapRef)
        })
    }, [mapRef, setHoveredLines, setSelectedLines])

    return {
        navStart,
        setNavStart,
        navEnd,
        setNavEnd,
        navStartQuery,
        setNavStartQuery,
        navEndQuery,
        setNavEndQuery,
        routeResult,
        showRoutePanel,
        routeLines,
        isRoutePanelClosing,
        algorithm,
        swapNavStations,
        handleCalculateRoute,
        handleAlgorithmSwitch,
        clearNavigation,
        handleCloseRoutePanel,
        clearRouteForTrainSelection,
        routeResultRef
    }
}
