import { useEffect, useMemo, useState } from 'react'
import { generatedLineSequences } from '../../data/generated/lineIndex'
import { getPanelLabel, stationPanelLabels } from '../../i18n/panelLabels'
import { languageTextStyle } from '../../utils/languageAnimation'
import { defaultStationFacilities } from '../../data/serviceInfo'
import { getStationConnections } from '../../utils/stationUtils'
import { useTheme } from '../../contexts/ThemeContext'
import { useStationAccessData } from '../../hooks/useStationAccessData'
import PanelCloseButton from '../UI/PanelCloseButton'
import PanelShell from '../UI/PanelShell'
import StationPanelHero from './StationPanelHero'
import StationPanelHeader from './StationPanelHeader'
import StationConnectionsSection from './StationConnectionsSection'
import StationArrivalsSection from './StationArrivalsSection'
import StationFacilitiesSection from './StationFacilitiesSection'
import StationExitsSection from './StationExitsSection'
import { getDisplayImages, naturalExitSort } from './stationPanelUtils'

export default function StationPanel({
    selectedStation, isClosing, isEntering, bookmarks,
    onClose, onToggleBookmark, onNavigateToStation,
    mrtData,
    mapRef, setSelectedLine, setSelectedLines, setIsEntering,
    stationLabelLanguage, labelOpacity,
    images = [],
    currentImage, onImageChange, isImageHovered, onImageHoverChange,
    activeEntranceMarkerRef,
    getArrivals
}) {
    const { t } = useTheme()
    const [arrivals, setArrivals] = useState([])
    const [wikipediaUrl, setWikipediaUrl] = useState('#')
    const panelLabel = (key) => getPanelLabel(stationPanelLabels, key, stationLabelLanguage)
    const animated = (opacity = labelOpacity) => languageTextStyle(labelOpacity, opacity)
    const selectedStationCodes = selectedStation?.station_codes || ''
    const selectedStationName = selectedStation?.name || ''
    const exitDataState = useStationAccessData(selectedStationCodes)
    const stationEntrances = useMemo(() => {
        if (exitDataState.stationCodes !== selectedStationCodes) return []
        return [...(exitDataState.entrances || [])].sort((a, b) => naturalExitSort(a.name, b.name))
    }, [exitDataState.entrances, exitDataState.stationCodes, selectedStationCodes])
    const exitLandmarksByExit = exitDataState.stationCodes === selectedStationCodes
        ? exitDataState.landmarks
        : {}

    useEffect(() => {
        if (!selectedStation || !getArrivals) return
        const codes = (selectedStation.station_codes || '').split('-')
        const poll = () => {
            try {
                const all = []
                codes.forEach(code => { all.push(...getArrivals(code)) })
                setArrivals(all)
            } catch {
                // Keep polling even if one arrival aggregation fails.
            }
        }
        poll()
        const timer = setInterval(poll, 3000)
        return () => clearInterval(timer)
    }, [selectedStation, getArrivals])

    useEffect(() => {
        if (!selectedStationName) return
        let cancelled = false
        import('../../data/loaders/wikipediaData').then(({ getWikipediaUrl }) => {
            getWikipediaUrl(selectedStationName).then(url => {
                if (!cancelled) setWikipediaUrl(url)
            }).catch(() => {
                if (!cancelled) setWikipediaUrl('#')
            })
        })
        return () => { cancelled = true }
    }, [selectedStationName])

    if (!selectedStation) return null

    const displayImages = getDisplayImages(images)
    const stationConnections = getStationConnections(selectedStation.station_codes || '', generatedLineSequences)
    const getExitLandmarks = (exitName) => exitLandmarksByExit[exitName] || []

    return (
        <PanelShell
            className="station-panel"
            side="right"
            width="430px"
            maxHeight="calc(100vh - 40px)"
            isClosing={isClosing}
            isEntering={isEntering}
            animation="station"
            scroll
        >
            <PanelCloseButton onClick={onClose} ariaLabel="Close station panel" />

            <StationPanelHero
                displayImages={displayImages}
                images={images}
                currentImage={currentImage}
                onImageChange={onImageChange}
                isImageHovered={isImageHovered}
                onImageHoverChange={onImageHoverChange}
                t={t}
            />

            <div style={{ padding: '22px', minHeight: 0 }}>
                <StationPanelHeader
                    selectedStation={selectedStation}
                    bookmarks={bookmarks}
                    onToggleBookmark={onToggleBookmark}
                    onClose={onClose}
                    mrtData={mrtData}
                    mapRef={mapRef}
                    setSelectedLine={setSelectedLine}
                    setSelectedLines={setSelectedLines}
                    setIsEntering={setIsEntering}
                    t={t}
                />

                <StationConnectionsSection
                    stationConnections={stationConnections}
                    stationLabelLanguage={stationLabelLanguage}
                    labelOpacity={labelOpacity}
                    animated={animated}
                    panelLabel={panelLabel}
                    onNavigateToStation={onNavigateToStation}
                    t={t}
                />

                <StationArrivalsSection
                    arrivals={arrivals}
                    stationLabelLanguage={stationLabelLanguage}
                    labelOpacity={labelOpacity}
                    animated={animated}
                    panelLabel={panelLabel}
                    t={t}
                />

                <StationFacilitiesSection
                    facilities={defaultStationFacilities}
                    language={stationLabelLanguage}
                    labelOpacity={labelOpacity}
                    t={t}
                />

                <StationExitsSection
                    stationEntrances={stationEntrances}
                    panelLabel={panelLabel}
                    animated={animated}
                    getExitLandmarks={getExitLandmarks}
                    mapRef={mapRef}
                    activeEntranceMarkerRef={activeEntranceMarkerRef}
                    selectedStation={selectedStation}
                    t={t}
                />

                <a
                    href={wikipediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-block', marginTop: '26px',
                        color: t.textPrimary, textDecoration: 'none',
                        padding: '12px 18px', borderRadius: '14px',
                        background: t.overlayMedium,
                        border: `1px solid ${t.borderMedium}`,
                        backdropFilter: 'blur(12px)', fontWeight: 600, transition: '0.25s'
                    }}
                >View Wikipedia</a>
            </div>
        </PanelShell>
    )
}
