import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../contexts/ThemeContext'
import { getLocalizedLabel, trainPanelLabels } from '../../i18n/trainPanelLabels'
import PanelCloseButton from '../UI/PanelCloseButton'
import PanelShell from '../UI/PanelShell'
import TrainPanelSummary from './TrainPanelSummary'
import TrainPanelViewToggle from './TrainPanelViewToggle'
import TrainPanelRouteList from './TrainPanelRouteList'
import {
    animatedLanguageStyle,
    buildTrainPanelState,
    getStationName
} from './trainPanelUtils'

export default function TrainPanel({
    trainData, isTrainPanelClosing,
    stationLabelLanguage, labelOpacity,
    onClose
}) {
    const { t } = useTheme()
    const listRef = useRef(null)
    const [trackingView, setTrackingView] = useState('bird')
    const panelState = buildTrainPanelState(trainData || {}, stationLabelLanguage)
    const {
        lineColor,
        stations,
        direction,
        atStation,
        activeIndex,
        activeCodes,
        activeName,
        orderedStations,
        stationETAs
    } = panelState

    const switchView = (mode) => {
        setTrackingView(mode)
        if (window.__trainSystem) window.__trainSystem.setTrackingView(mode)
    }

    const labels = {
        train: getLocalizedLabel(trainPanelLabels, 'train', stationLabelLanguage),
        to: getLocalizedLabel(trainPanelLabels, 'to', stationLabelLanguage),
        next: getLocalizedLabel(trainPanelLabels, 'next', stationLabelLanguage),
        current: getLocalizedLabel(trainPanelLabels, 'current', stationLabelLanguage),
        route: getLocalizedLabel(trainPanelLabels, 'route', stationLabelLanguage)
    }
    const stationName = (code) => getStationName(code, stationLabelLanguage)
    const animated = (opacity = labelOpacity) => animatedLanguageStyle(labelOpacity, opacity)

    useEffect(() => {
        if (!trainData || !listRef.current || activeIndex == null) return
        const el = listRef.current.querySelector(`[data-stn-idx="${activeIndex}"]`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [activeIndex, trainData])

    if (!trainData) return null

    return (
        <PanelShell
            side="right"
            maxHeight="calc(100vh - 200px)"
            zIndex={12}
            isClosing={isTrainPanelClosing}
            display="flex"
        >
            {/* Color bar */}
            <div style={{ height: '10px', background: lineColor, flexShrink: 0 }} />

            <div style={{ position: 'relative', flexShrink: 0 }}>
                <PanelCloseButton onClick={onClose} ariaLabel="Close train panel" />
            </div>
            <TrainPanelSummary
                t={t}
                trainData={trainData}
                lineColor={lineColor}
                activeCodes={activeCodes}
                activeName={activeName}
                atStation={atStation}
                stationName={stationName}
                animated={animated}
                labels={labels}
            />
            <TrainPanelViewToggle
                t={t}
                trackingView={trackingView}
                stationLabelLanguage={stationLabelLanguage}
                animated={animated}
                onSwitchView={switchView}
            />
            <TrainPanelRouteList
                t={t}
                lineColor={lineColor}
                orderedStations={orderedStations}
                stations={stations}
                activeIndex={activeIndex}
                direction={direction}
                labelOpacity={labelOpacity}
                animated={animated}
                stationName={stationName}
                stationETAs={stationETAs}
                routeLabel={labels.route}
                listRef={listRef}
            />
        </PanelShell>
    )
}
