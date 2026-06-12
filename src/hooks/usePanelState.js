import { useCallback, useEffect, useRef, useState } from 'react'
import { stationLineToActualCode } from '../config'
import { focusStationCamera } from '../camera/stationCamera'
import { stopLineTourCamera } from '../camera/lineTourCamera'

export function usePanelState({
    mapRef,
    mrtData,
    activeEntranceMarkerRef,
    resetCurrentImage,
    selectedTrain,
    setSelectedTrain,
    clearRouteForTrainSelection
}) {
    const prevSelectedTrainRef = useRef(null)

    const [selectedStation, setSelectedStation] = useState(null)
    const [selectedLine, setSelectedLine] = useState(null)
    const [selectedLines, setSelectedLines] = useState([])
    const [hoveredLines, setHoveredLines] = useState([])
    const [isStationHovered, setIsStationHovered] = useState(false)
    const [hoveredStationCodes, setHoveredStationCodes] = useState(null)
    const [isClosing, setIsClosing] = useState(false)
    const [isLineClosing, setIsLineClosing] = useState(false)
    const [isEntering, setIsEntering] = useState(false)
    const [popupLines, setPopupLines] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [showSearch, setShowSearch] = useState(false)
    const [showLineBar, setShowLineBar] = useState(false)
    const [showBookmarks, setShowBookmarks] = useState(false)
    const [showNavigation, setShowNavigation] = useState(false)
    const [isTrainPanelClosing, setIsTrainPanelClosing] = useState(false)
    const [isNavClosing, setIsNavClosing] = useState(false)
    const [isBookmarksClosing, setIsBookmarksClosing] = useState(false)
    const [isSearchClosing, setIsSearchClosing] = useState(false)

    const closePanel = useCallback(() => {
        if (activeEntranceMarkerRef.current) {
            activeEntranceMarkerRef.current.remove()
            activeEntranceMarkerRef.current = null
        }
        setIsClosing(true)
        stopLineTourCamera()
        setHoveredStationCodes(null)
        setSelectedLines([])
        setTimeout(() => {
            setSelectedStation(null)
            setIsClosing(false)
            setHoveredLines([])
        }, 350)
    }, [activeEntranceMarkerRef])

    const closeLinePanel = useCallback(() => {
        setIsLineClosing(true)
        stopLineTourCamera({ stopMapAnimation: true })
        setHoveredLines([])
        setSelectedLines([])
        setTimeout(() => {
            setSelectedLine(null)
            setIsLineClosing(false)
        }, 350)
    }, [])

    const navigateToStation = useCallback((stationCode) => {
        if (activeEntranceMarkerRef.current) {
            activeEntranceMarkerRef.current.remove()
            activeEntranceMarkerRef.current = null
        }
        stopLineTourCamera()

        const feature = mrtData.features.find(f => {
            if (f.geometry.type !== 'Point') return false
            if (f.properties.stop_type === 'entrance') return false
            if (f.properties.type === 'subway') return false
            return (f.properties.station_codes || '').split('-').includes(stationCode)
        })

        if (!feature || !mapRef.current) return

        focusStationCamera(mapRef.current, feature.geometry.coordinates)

        resetCurrentImage()

        const stationLines = (feature.properties.station_codes || '').split('-')
            .map(line => {
                const prefix = line.match(/^[A-Z]+/)?.[0]
                return stationLineToActualCode[prefix] || prefix
            })
            .filter(Boolean)

        setSelectedLines([...new Set(stationLines)])
        setIsEntering(true)

        setSelectedStation({
            ...feature.properties,
            geometry: feature.geometry,
            lines: (feature.properties.station_codes || '').split('-'),
            station_codes: feature.properties.station_codes
        })

        setTimeout(() => setIsEntering(false), 150)
    }, [activeEntranceMarkerRef, mapRef, mrtData, resetCurrentImage])

    const handleCloseTrainPanel = useCallback(() => {
        setIsTrainPanelClosing(true)
        window.__trainSystem?._stopTracking()
        setTimeout(() => {
            setSelectedTrain(null)
            setIsTrainPanelClosing(false)
        }, 350)
    }, [setSelectedTrain])

    useEffect(() => {
        if (selectedStation || selectedLine) {
            window.__trainSystem?._stopTracking()
            setSelectedTrain(null)
        }
    }, [selectedLine, selectedStation, setSelectedTrain])

    useEffect(() => {
        if (selectedTrain && !prevSelectedTrainRef.current) {
            stopLineTourCamera()
            setSelectedStation(null)
            setSelectedLine(null)
            clearRouteForTrainSelection()
        }
        prevSelectedTrainRef.current = selectedTrain
    }, [clearRouteForTrainSelection, selectedTrain])

    return {
        selectedStation,
        setSelectedStation,
        selectedLine,
        setSelectedLine,
        selectedLines,
        setSelectedLines,
        hoveredLines,
        setHoveredLines,
        isStationHovered,
        setIsStationHovered,
        hoveredStationCodes,
        setHoveredStationCodes,
        isClosing,
        setIsClosing,
        isLineClosing,
        setIsLineClosing,
        isEntering,
        setIsEntering,
        popupLines,
        setPopupLines,
        searchQuery,
        setSearchQuery,
        showSearch,
        setShowSearch,
        showLineBar,
        setShowLineBar,
        showBookmarks,
        setShowBookmarks,
        showNavigation,
        setShowNavigation,
        isTrainPanelClosing,
        isNavClosing,
        setIsNavClosing,
        isBookmarksClosing,
        setIsBookmarksClosing,
        isSearchClosing,
        setIsSearchClosing,
        closePanel,
        closeLinePanel,
        navigateToStation,
        handleCloseTrainPanel
    }
}
