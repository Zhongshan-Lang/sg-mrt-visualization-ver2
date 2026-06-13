import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'

import { animations, globalStyles } from './styles/animations'
import { useBookmarks } from './hooks/useBookmarks'
import { useImageCarousel } from './hooks/useImageCarousel'
import { useLanguageCycle } from './hooks/useLanguageCycle'
import { useCloseOnEscape } from './hooks/useCloseOnEscape'
import { useSimulation } from './hooks/useSimulation'
import { usePanelState } from './hooks/usePanelState'
import { useRouteNavigation } from './hooks/useRouteNavigation'
import { useMapLifecycle } from './hooks/useMapLifecycle'
import { useRailData } from './hooks/useRailData'

import TopBar from './components/Search/TopBar'
import DesktopChromeToggle from './components/UI/DesktopChromeToggle'
import LineBar from './components/UI/LineBar'
import Toolbar from './components/UI/Toolbar'
import { useTheme } from './contexts/ThemeContext'

const StationPanel = lazy(() => import('./components/Panels/StationPanel'))
const LinePanel = lazy(() => import('./components/Panels/LinePanel'))
const RoutePanel = lazy(() => import('./components/Panels/RoutePanel'))
const TrainPanel = lazy(() => import('./components/Panels/TrainPanel'))
const GuideModal = lazy(() => import('./components/UI/GuideModal'))

function App() {
  const { theme, t, toggleTheme } = useTheme()
  const apiKey = import.meta.env.VITE_MAPTILER_KEY
  const mapStyleUrl = `https://api.maptiler.com/maps/streets-v2${theme === 'dark' ? '-dark' : ''}/style.json?key=${apiKey}`

  const mapContainer = useRef(null)
  const mapRef = useRef(null)
  const activeEntranceMarkerRef = useRef(null)
  const resetCurrentImageRef = useRef(() => {})
  const clearRouteForTrainSelectionRef = useRef(() => {})
  const [showGuide, setShowGuide] = useState(false)
  const [showDesktopChrome, setShowDesktopChrome] = useState(true)
  const mrtData = useRailData()

  const { bookmarks, toggleBookmark } = useBookmarks()
  const {
    stationLabelLanguage,
    labelOpacity,
    cycleLanguageNow,
    isLanguageLocked,
    toggleLanguageLock
  } = useLanguageCycle()
  const {
    isSimulationRunning,
    showTrains,
    simSpeed,
    selectedTrain,
    setSelectedTrain,
    toggleSimulation,
    toggleTrainVisibility,
    getArrivals,
    cycleSpeed,
    initSimulation,
    cleanupSimulation
  } = useSimulation(mapRef, mrtData)

  const resetCurrentImage = useCallback(() => resetCurrentImageRef.current(), [])
  const clearRouteForTrainSelectionProxy = useCallback(() => {
    clearRouteForTrainSelectionRef.current()
  }, [])

  const panel = usePanelState({
    mapRef,
    mrtData,
    activeEntranceMarkerRef,
    resetCurrentImage,
    selectedTrain,
    setSelectedTrain,
    clearRouteForTrainSelection: clearRouteForTrainSelectionProxy
  })

  const {
    currentImage,
    setCurrentImage,
    isImageHovered,
    setIsImageHovered,
    images: stationPanelImages
  } = useImageCarousel(panel.selectedStation)

  const route = useRouteNavigation({
    mapRef,
    mrtData,
    setSelectedLines: panel.setSelectedLines,
    setHoveredLines: panel.setHoveredLines,
    setShowNavigation: panel.setShowNavigation,
    setIsNavClosing: panel.setIsNavClosing
  })

  useEffect(() => {
    resetCurrentImageRef.current = () => setCurrentImage(0)
  }, [setCurrentImage])

  useEffect(() => {
    clearRouteForTrainSelectionRef.current = route.clearRouteForTrainSelection
  }, [route.clearRouteForTrainSelection])

  const map = useMapLifecycle({
    theme,
    t,
    mapStyleUrl,
    mapContainer,
    mapRef,
    activeEntranceMarkerRef,
    mrtData,
    hoveredLines: panel.hoveredLines,
    selectedLines: panel.selectedLines,
    routeResultRef: route.routeResultRef,
    initSimulation,
    cleanupSimulation,
    closePanel: panel.closePanel,
    closeLinePanel: panel.closeLinePanel,
    setSelectedStation: panel.setSelectedStation,
    setSelectedLine: panel.setSelectedLine,
    setSelectedLines: panel.setSelectedLines,
    setHoveredLines: panel.setHoveredLines,
    setHoveredStationCodes: panel.setHoveredStationCodes,
    setIsStationHovered: panel.setIsStationHovered,
    setIsEntering: panel.setIsEntering,
    setCurrentImage,
    setPopupLines: panel.setPopupLines
  })
  const setStationLabelLayerVisibility = map.setStationLabelLayerVisibility

  useCloseOnEscape(panel.closePanel, panel.closeLinePanel)

  useEffect(() => {
    setStationLabelLayerVisibility(showDesktopChrome)
  }, [setStationLabelLayerVisibility, showDesktopChrome])

  const handleDesktopChromeToggle = () => {
    setShowDesktopChrome(prev => !prev)
  }

  return (
    <>
      <style>{animations + globalStyles}</style>

      <TopBar
        chromeVisible={showDesktopChrome}
        searchQuery={panel.searchQuery}
        setSearchQuery={panel.setSearchQuery}
        bookmarks={bookmarks}
        showBookmarks={panel.showBookmarks}
        setShowBookmarks={panel.setShowBookmarks}
        showNavigation={panel.showNavigation}
        setShowNavigation={panel.setShowNavigation}
        isBookmarksClosing={panel.isBookmarksClosing}
        setIsBookmarksClosing={panel.setIsBookmarksClosing}
        isNavClosing={panel.isNavClosing}
        setIsNavClosing={panel.setIsNavClosing}
        isSearchClosing={panel.isSearchClosing}
        setIsSearchClosing={panel.setIsSearchClosing}
        navStart={route.navStart}
        setNavStart={route.setNavStart}
        navEnd={route.navEnd}
        setNavEnd={route.setNavEnd}
        navStartQuery={route.navStartQuery}
        setNavStartQuery={route.setNavStartQuery}
        navEndQuery={route.navEndQuery}
        setNavEndQuery={route.setNavEndQuery}
        routeResult={route.routeResult}
        showRoutePanel={route.showRoutePanel}
        onSwapNavStations={route.swapNavStations}
        onNavigateToStation={panel.navigateToStation}
        onCalculateRoute={route.handleCalculateRoute}
        onClearNavigation={route.clearNavigation}
        stationLabelLanguage={stationLabelLanguage}
        onCycleLanguage={cycleLanguageNow}
        isLanguageLocked={isLanguageLocked}
        onToggleLanguageLock={toggleLanguageLock}
        onOpenGuide={() => setShowGuide(true)}
      />

      <LineBar
        chromeVisible={showDesktopChrome}
        allLines={map.allLines}
        mapRef={mapRef}
        setSelectedStation={panel.setSelectedStation}
        setIsClosing={panel.setIsClosing}
        setSelectedLine={panel.setSelectedLine}
        setSelectedLines={panel.setSelectedLines}
        setIsEntering={panel.setIsEntering}
        setHoveredLines={panel.setHoveredLines}
        isSimulationRunning={isSimulationRunning}
        simSpeed={simSpeed}
        onToggleSimulation={toggleSimulation}
        onCycleSpeed={cycleSpeed}
        showTrains={showTrains}
        onToggleTrainVisibility={toggleTrainVisibility}
      />

      <Toolbar
        chromeVisible={showDesktopChrome}
        mapRef={mapRef}
        showBuildings={map.showBuildings}
        onToggleBuildings={map.toggleBuildings}
        theme={theme}
        onToggleTheme={toggleTheme}
        is2D={map.isMap2D}
        bearing={map.mapBearing}
        onToggle2D3D={map.handleToggle2D3D}
        bottom={62}
      />

      <DesktopChromeToggle
        visible={showDesktopChrome}
        onToggle={handleDesktopChromeToggle}
      />

      <div ref={mapContainer} style={{ width: '100vw', height: '100vh' }} />

      {map.isLoading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 50,
          background: theme === 'dark' ? 'rgba(15,15,15,0.6)' : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: map.isLoadingFading ? 0 : 1,
          transition: 'opacity 0.6s ease'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '48px', height: '48px', margin: '0 auto',
              border: `3px solid ${t.overlayScrollThumb}`,
              borderTopColor: t.textPrimary,
              borderRadius: '50%',
              animation: 'loadingSpin 0.8s linear infinite'
            }} />
            <div style={{
              color: t.textPrimary, marginTop: '18px',
              fontSize: '15px', fontWeight: '500', letterSpacing: '0.5px'
            }}>
              Loading MRT Network...
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        {panel.selectedStation && (
          <StationPanel
            selectedStation={panel.selectedStation}
            isClosing={panel.isClosing}
            isEntering={panel.isEntering}
            bookmarks={bookmarks}
            onClose={panel.closePanel}
            onToggleBookmark={toggleBookmark}
            onNavigateToStation={panel.navigateToStation}
            mrtData={mrtData}
            mapRef={mapRef}
            setSelectedLine={panel.setSelectedLine}
            setSelectedLines={panel.setSelectedLines}
            setIsEntering={panel.setIsEntering}
            stationLabelLanguage={stationLabelLanguage}
            labelOpacity={labelOpacity}
            images={stationPanelImages}
            currentImage={currentImage}
            onImageChange={setCurrentImage}
            isImageHovered={isImageHovered}
            onImageHoverChange={setIsImageHovered}
            activeEntranceMarkerRef={activeEntranceMarkerRef}
            getArrivals={getArrivals}
          />
        )}

        {route.showRoutePanel && route.routeResult && (
          <RoutePanel
            routeResult={route.routeResult}
            navStart={route.navStart}
            navEnd={route.navEnd}
            isRoutePanelClosing={route.isRoutePanelClosing}
            stationLabelLanguage={stationLabelLanguage}
            labelOpacity={labelOpacity}
            algorithm={route.algorithm}
            onAlgorithmChange={route.handleAlgorithmSwitch}
            onClose={route.handleCloseRoutePanel}
            onClearNavigation={route.clearNavigation}
            onNavigateToStation={panel.navigateToStation}
          />
        )}

        {selectedTrain && (
          <TrainPanel
            key={selectedTrain.id}
            trainData={selectedTrain}
            isTrainPanelClosing={panel.isTrainPanelClosing}
            stationLabelLanguage={stationLabelLanguage}
            labelOpacity={labelOpacity}
            onClose={panel.handleCloseTrainPanel}
          />
        )}

        {(panel.selectedLine || panel.isLineClosing) && panel.selectedLine && (
          <LinePanel
            selectedLine={panel.selectedLine}
            isLineClosing={panel.isLineClosing}
            isEntering={panel.isEntering}
            onClose={panel.closeLinePanel}
            stationLabelLanguage={stationLabelLanguage}
            labelOpacity={labelOpacity}
            onNavigateToStation={panel.navigateToStation}
          />
        )}

        {showGuide && (
          <GuideModal onClose={() => setShowGuide(false)} />
        )}
      </Suspense>
    </>
  )
}

export default App
