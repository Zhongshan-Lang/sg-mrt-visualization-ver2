import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { getAllLines } from '../utils/stationUtils'
import { useMapLayers } from '../components/Map/MapLayers'
import { useMapInteractions } from '../components/Map/MapInteractions'
import { loadRouteUtils } from '../utils/routeModule'
import { configureBuildingLayer, findBuildingLayer } from '../components/Map/mapLayerOrdering'
import { applyLineHighlighting, useLineHighlighting } from './useLineHighlighting'
import { useMapThemeStyle } from './useMapThemeStyle'

const STATION_LABEL_OPACITY_STORAGE_KEY = 'mrt-station-label-opacity'
const BASE_STATION_LABEL_OPACITY = ['interpolate', ['linear'], ['zoom'], 8, 0, 10, 0.3, 12, 0.6, 14, 1, 16, 0.8, 18, 0.4, 20, 0]
const BASE_ENTRANCE_LABEL_OPACITY = 0.7

function applyStationLabelOpacity(map, opacity) {
    if (!map) return

    const next = Math.max(0, Math.min(1, opacity))

    if (map.getLayer('station-labels')) {
        map.setPaintProperty(
            'station-labels',
            'text-opacity',
            next === 0 ? 0 : ['*', BASE_STATION_LABEL_OPACITY, next]
        )
    }

    if (map.getLayer('entrance-labels')) {
        map.setPaintProperty(
            'entrance-labels',
            'text-opacity',
            next === 0 ? 0 : BASE_ENTRANCE_LABEL_OPACITY * next
        )
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
    const showBuildingsRef = useRef(true)
    const [allLines, setAllLines] = useState([])
    const [showBuildings, setShowBuildings] = useState(true)
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingFading, setIsLoadingFading] = useState(false)
    const [isMap2D, setIsMap2D] = useState(false)
    const [mapBearing, setMapBearing] = useState(0)
    const [stationNameOpacity, setStationNameOpacityState] = useState(() => {
        const stored = Number(localStorage.getItem(STATION_LABEL_OPACITY_STORAGE_KEY))
        return Number.isFinite(stored) ? Math.max(0, Math.min(1, stored)) : 1
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
        initializeLayers()
        configureBuildingLayer(mapRef.current, showBuildingsRef.current)
        applyStationLabelOpacity(mapRef.current, stationNameOpacity)

        const refs = setupInteractions()
        activeEntranceMarkerRef.current = refs?.activeEntranceMarkerRef?.current

        if (routeResultRef.current) {
            loadRouteUtils().then(({ createRouteHighlight }) => {
                createRouteHighlight(mapRef, routeResultRef.current, mrtData)
            })
        }

        applyLineHighlighting(mapRef.current, hoveredLines, selectedLines, routeResultRef.current)
    }, [activeEntranceMarkerRef, hoveredLines, initializeLayers, mapRef, mrtData, routeResultRef, selectedLines, setupInteractions, stationNameOpacity])

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

    useEffect(() => {
        mapRef.current = new maplibregl.Map({
            container: mapContainer.current,
            style: mapStyleUrl,
            center: [103.851959, 1.290270],
            zoom: 15, pitch: 65, bearing: -35, antialias: true, maxPitch: 60
        })

        mapRef.current.on('load', () => {
            initMapFeatures()
            mapLoadedRef.current = true
            setTimeout(() => setIsLoadingFading(true), 300)
            setTimeout(() => setIsLoading(false), 900)
        })

        mapRef.current.on('pitch', () => {
            const pitch = mapRef.current?.getPitch() || 0
            setIsMap2D(pitch === 0)
        })

        mapRef.current.on('rotate', () => {
            setMapBearing(mapRef.current?.getBearing() || 0)
        })

        return () => {
            cleanupSimulation()
            mapRef.current?.remove()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useMapThemeStyle({ theme, t, mapRef, mapLoadedRef, mapStyleUrl, initMapFeatures })

    return {
        allLines,
        showBuildings,
        isLoading,
        isLoadingFading,
        isMap2D,
        mapBearing,
        stationNameOpacity,
        setStationNameOpacity,
        toggleBuildings,
        handleToggle2D3D
    }
}
