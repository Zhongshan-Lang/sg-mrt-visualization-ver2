import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { getAllLines } from '../utils/stationUtils'
import { useMapLayers } from '../components/Map/MapLayers'
import { useMapInteractions } from '../components/Map/MapInteractions'
import { loadRouteUtils } from '../utils/routeModule'
import { configureBuildingLayer, findBuildingLayer, setMrtNetworkLayerVisibility } from '../components/Map/mapLayerOrdering'
import { applyLineHighlighting, useLineHighlighting } from './useLineHighlighting'
import { useMapThemeStyle } from './useMapThemeStyle'

const STATION_LABEL_OPACITY_STORAGE_KEY = 'mrt-station-label-opacity'
const BASE_STATION_LABEL_OPACITY = ['interpolate', ['linear'], ['zoom'], 8, 0, 10, 0.3, 12, 0.6, 14, 1, 16, 0.8, 18, 0.4, 20, 0]
const BASE_ENTRANCE_LABEL_OPACITY = 0.7
const STATION_LABEL_VISIBILITY_FADE_MS = 220

export function buildStationLabelOpacityExpression(opacity) {
    const expression = [...BASE_STATION_LABEL_OPACITY]

    for (let index = 4; index < expression.length; index += 2) {
        expression[index] *= opacity
    }

    return expression
}

function applyStationLabelOpacity(map, opacity) {
    if (!map) return

    const next = Math.max(0, Math.min(1, opacity))

    if (map.getLayer('station-labels')) {
        map.setPaintProperty(
            'station-labels',
            'text-opacity',
            buildStationLabelOpacityExpression(next)
        )
    }

    if (map.getLayer('entrance-labels')) {
        map.setPaintProperty(
            'entrance-labels',
            'text-opacity',
            BASE_ENTRANCE_LABEL_OPACITY * next
        )
    }
}

function applyStationLabelVisibility(map, visible) {
    if (!map) return

    const visibility = visible ? 'visible' : 'none'

    if (map.getLayer('station-labels')) {
        map.setLayoutProperty('station-labels', 'visibility', visibility)
    }

    if (map.getLayer('entrance-labels')) {
        map.setLayoutProperty('entrance-labels', 'visibility', visibility)
    }

    map.triggerRepaint?.()
}

function setStationLabelTransition(map, duration = STATION_LABEL_VISIBILITY_FADE_MS) {
    if (!map) return

    if (map.getLayer('station-labels')) {
        map.setPaintProperty('station-labels', 'text-opacity-transition', { duration, delay: 0 })
    }

    if (map.getLayer('entrance-labels')) {
        map.setPaintProperty('entrance-labels', 'text-opacity-transition', { duration, delay: 0 })
    }
}

export function useMapLifecycle({
    theme,
    t,
    mapStyleUrl,
    mapContainer,
    mapRef,
    activeEntranceMarkerRef,
    mrtData,
    hoveredLines,
    selectedLines,
    routeResultRef,
    initSimulation,
    cleanupSimulation,
    closePanel,
    closeLinePanel,
    setSelectedStation,
    setSelectedLine,
    setSelectedLines,
    setHoveredLines,
    setHoveredStationCodes,
    setIsStationHovered,
    setIsEntering,
    setCurrentImage,
    setPopupLines
}) {
    const mapLoadedRef = useRef(false)
    const loadingSettledRef = useRef(false)
    const showBuildingsRef = useRef(true)
    const showNetworkRef = useRef(true)
    const stationLabelLayerVisibleRef = useRef(true)
    const stationLabelVisibilityTimerRef = useRef(null)
    const [allLines, setAllLines] = useState([])
    const [showBuildings, setShowBuildings] = useState(true)
    const [showNetwork, setShowNetwork] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingFading, setIsLoadingFading] = useState(false)
    const [isMap2D, setIsMap2D] = useState(false)
    const [mapBearing, setMapBearing] = useState(0)
    const [stationNameOpacity, setStationNameOpacityState] = useState(() => {
        const stored = Number(localStorage.getItem(STATION_LABEL_OPACITY_STORAGE_KEY))
        if (!Number.isFinite(stored)) return 1
        const normalized = Math.max(0, Math.min(1, stored))
        return normalized === 0 ? 1 : normalized
    })
    const { initializeLayers } = useMapLayers(mapRef, mrtData, () => {
        setAllLines(getAllLines(mrtData))
        initSimulation()
    })

    const { setupInteractions } = useMapInteractions(mapRef, {
        setSelectedStation, setSelectedLine, setSelectedLines,
        setHoveredLines, setHoveredStationCodes,
        setIsStationHovered, setIsEntering, setCurrentImage,
        setPopupLines, closePanel, closeLinePanel
    })

    const initMapFeatures = useCallback(() => {
        if (!mrtData) return
        initializeLayers()
        configureBuildingLayer(mapRef.current, showBuildingsRef.current)
        setMrtNetworkLayerVisibility(mapRef.current, showNetworkRef.current)
        setStationLabelTransition(mapRef.current)
        applyStationLabelOpacity(mapRef.current, stationNameOpacity)
        applyStationLabelVisibility(mapRef.current, stationLabelLayerVisibleRef.current)

        const refs = setupInteractions()
        activeEntranceMarkerRef.current = refs?.activeEntranceMarkerRef?.current

        if (routeResultRef.current) {
            loadRouteUtils().then(({ createRouteHighlight }) => {
                createRouteHighlight(mapRef, routeResultRef.current, mrtData)
            })
        }

        applyLineHighlighting(mapRef.current, hoveredLines, selectedLines, routeResultRef.current)
    }, [activeEntranceMarkerRef, hoveredLines, initializeLayers, mapRef, mrtData, routeResultRef, selectedLines, setupInteractions, stationNameOpacity])

    const settleLoadingState = useCallback(() => {
        if (loadingSettledRef.current) return
        loadingSettledRef.current = true
        setTimeout(() => setIsLoadingFading(true), 300)
        setTimeout(() => setIsLoading(false), 900)
    }, [])

    const toggleBuildings = useCallback(() => {
        setShowBuildings(prev => {
            const newVal = !prev
            showBuildingsRef.current = newVal
            const buildingLayerId = findBuildingLayer(mapRef.current)
            if (buildingLayerId) {
                mapRef.current.setLayoutProperty(
                    buildingLayerId,
                    'visibility',
                    newVal ? 'visible' : 'none'
                )
            }
            return newVal
        })
    }, [mapRef])

    const toggleNetwork = useCallback(() => {
        setShowNetwork(prev => {
            const next = !prev
            showNetworkRef.current = next
            setMrtNetworkLayerVisibility(mapRef.current, next)
            return next
        })
    }, [mapRef])

    const handleToggle2D3D = useCallback(() => {
        if (!mapRef.current) return
        const new2D = !isMap2D
        setIsMap2D(new2D)
        mapRef.current.flyTo({
            pitch: new2D ? 0 : 65,
            duration: 1000,
            essential: true
        })
    }, [isMap2D, mapRef])

    useLineHighlighting({ mapRef, hoveredLines, selectedLines, routeResultRef })

    const setStationNameOpacity = useCallback((value) => {
        const next = Math.max(0, Math.min(1, value))
        setStationNameOpacityState(next)
        localStorage.setItem(STATION_LABEL_OPACITY_STORAGE_KEY, String(next))
        applyStationLabelOpacity(mapRef.current, next)
    }, [mapRef])

    const setStationLabelLayerVisibility = useCallback((visible) => {
        if (stationLabelVisibilityTimerRef.current) {
            clearTimeout(stationLabelVisibilityTimerRef.current)
            stationLabelVisibilityTimerRef.current = null
        }

        stationLabelLayerVisibleRef.current = visible

        if (visible) {
            applyStationLabelVisibility(mapRef.current, true)
            setStationLabelTransition(mapRef.current)
            requestAnimationFrame(() => {
                applyStationLabelOpacity(mapRef.current, stationNameOpacity)
            })
            return
        }

        setStationLabelTransition(mapRef.current)
        applyStationLabelOpacity(mapRef.current, 0)
        stationLabelVisibilityTimerRef.current = setTimeout(() => {
            if (!stationLabelLayerVisibleRef.current) {
                applyStationLabelVisibility(mapRef.current, false)
            }
            stationLabelVisibilityTimerRef.current = null
        }, STATION_LABEL_VISIBILITY_FADE_MS)
    }, [mapRef, stationNameOpacity])

    useEffect(() => {
        mapRef.current = new maplibregl.Map({
            container: mapContainer.current,
            style: mapStyleUrl,
            center: [103.851959, 1.290270],
            zoom: 15, pitch: 65, bearing: -35, antialias: true, maxPitch: 60
        })

        mapRef.current.on('load', () => {
            mapLoadedRef.current = true
            if (mrtData) {
                initMapFeatures()
                settleLoadingState()
            }
        })

        mapRef.current.on('pitch', () => {
            const pitch = mapRef.current?.getPitch() || 0
            setIsMap2D(pitch === 0)
        })

        mapRef.current.on('rotate', () => {
            setMapBearing(mapRef.current?.getBearing() || 0)
        })

        return () => {
            if (stationLabelVisibilityTimerRef.current) {
                clearTimeout(stationLabelVisibilityTimerRef.current)
            }
            cleanupSimulation()
            mapRef.current?.remove()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        if (!mapLoadedRef.current || !mapRef.current || !mrtData) return
        if (!mapRef.current.getSource('mrt-line')) {
            initMapFeatures()
        }
        settleLoadingState()
    }, [initMapFeatures, mapRef, mrtData, settleLoadingState])

    useMapThemeStyle({ theme, t, mapRef, mapLoadedRef, mapStyleUrl, initMapFeatures })

    return {
        allLines,
        showBuildings,
        showNetwork,
        isLoading,
        isLoadingFading,
        isMap2D,
        mapBearing,
        stationNameOpacity,
        setStationNameOpacity,
        setStationLabelLayerVisibility,
        toggleBuildings,
        toggleNetwork,
        handleToggle2D3D
    }
}
