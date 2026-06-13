import { useEffect, useMemo, useState } from 'react'
import { lineColors } from '../../config'
import { stationCodeToData } from '../../data/generated/stationIndex'
import { getStationAccessDataForStation } from '../../data/loaders/stationAccessData'
import { useTheme } from '../../contexts/ThemeContext'
import { getPanelLabel, routePanelLabels } from '../../i18n/panelLabels'
import { languageTextStyle } from '../../utils/languageAnimation'
import { estimateRouteFareFromStops } from '../../data/serviceInfo'
import PanelCloseButton from '../UI/PanelCloseButton'
import PanelShell from '../UI/PanelShell'
import RoutePanelHeader from './RoutePanelHeader'
import RoutePanelStats from './RoutePanelStats'
import RoutePanelTimeline from './RoutePanelTimeline'
import RoutePanelExitSection from './RoutePanelExitSection'
import RoutePanelSegments from './RoutePanelSegments'
import {
    extraRouteLabels,
    buildTimelineSteps,
    getJourneyStats,
    getStationKey,
    getRecommendedExit
} from './routePanelUtils'

export default function RoutePanel({
    routeResult, navStart, navEnd,
    isRoutePanelClosing, stationLabelLanguage, labelOpacity,
    algorithm, onAlgorithmChange,
    onClose, onNavigateToStation
}) {
    const { t } = useTheme()
    const [arrivalExitState, setArrivalExitState] = useState({ stationCodes: null, entrances: [], landmarks: {} })

    const routeLabel = (key) => getPanelLabel(routePanelLabels, key, stationLabelLanguage)
    const localLabel = (key) => extraRouteLabels[key]?.[stationLabelLanguage] || extraRouteLabels[key]?.en || key
    const fareLabel = { en: 'Fare', zh: '票价', ta: 'கட்டணம்' }[stationLabelLanguage] || 'Fare'
    const algorithmLabel = (label) => label[stationLabelLanguage] || label.en
    const animated = (opacity = labelOpacity) => languageTextStyle(labelOpacity, opacity)
    const transferCount = routeResult ? routeResult.length - 1 : 0
    const journeyStats = getJourneyStats(routeResult || [], transferCount)
    const fareEstimate = estimateRouteFareFromStops(journeyStats.stops)
    const timelineSteps = useMemo(() => buildTimelineSteps(routeResult), [routeResult])
    const stationKey = useMemo(() => getStationKey(navEnd), [navEnd])
    const arrivalExitLandmarks = useMemo(
        () => (arrivalExitState.stationCodes === stationKey ? arrivalExitState.landmarks : {}),
        [arrivalExitState.landmarks, arrivalExitState.stationCodes, stationKey]
    )
    const arrivalEntrances = useMemo(
        () => (arrivalExitState.stationCodes === stationKey ? arrivalExitState.entrances : []),
        [arrivalExitState.entrances, arrivalExitState.stationCodes, stationKey]
    )
    const arrivalExit = useMemo(
        () => getRecommendedExit(arrivalEntrances, arrivalExitLandmarks),
        [arrivalEntrances, arrivalExitLandmarks]
    )

    useEffect(() => {
        if (!stationKey) return

        let cancelled = false
        getStationAccessDataForStation(stationKey).then(({ stationCodes, entrances, landmarks }) => {
            if (!cancelled) {
                setArrivalExitState({
                    stationCodes,
                    entrances,
                    landmarks
                })
            }
        }).catch(() => {
            if (!cancelled) {
                setArrivalExitState({ stationCodes: stationKey, entrances: [], landmarks: {} })
            }
        })
        return () => { cancelled = true }
    }, [stationKey])

    if (!routeResult) return null

    return (
        <PanelShell
            width="430px"
            maxHeight="calc(100vh - 40px)"
            isClosing={isRoutePanelClosing}
            display="flex"
        >
            <div style={{ height: '10px', background: lineColors[routeResult[0]?.line] || '#005ec4', flexShrink: 0 }} />

            <div style={{ position: 'relative' }}>
                <PanelCloseButton onClick={onClose} top={18} right={18} variant="glass" ariaLabel="Close route panel" />
            </div>

            <RoutePanelHeader
                routeResult={routeResult}
                algorithm={algorithm}
                onAlgorithmChange={onAlgorithmChange}
                routeLabel={routeLabel}
                algorithmLabel={algorithmLabel}
                animated={animated}
                t={t}
            />

            <RoutePanelStats
                navStart={navStart}
                navEnd={navEnd}
                stationLabelLanguage={stationLabelLanguage}
                labelOpacity={labelOpacity}
                routeLabel={routeLabel}
                localLabel={localLabel}
                fareLabel={fareLabel}
                transferCount={transferCount}
                journeyStats={journeyStats}
                fareEstimate={fareEstimate}
                stationCodeToData={stationCodeToData}
                animated={animated}
                t={t}
            />

            <div className="nav-scroll" style={{ padding: '0 24px 24px 24px', overflowY: 'auto', flex: 1 }}>
                <RoutePanelTimeline
                    steps={timelineSteps}
                    stationLabelLanguage={stationLabelLanguage}
                    labelOpacity={labelOpacity}
                    animated={animated}
                    localLabel={localLabel}
                    onNavigateToStation={onNavigateToStation}
                    t={t}
                />

                <RoutePanelExitSection
                    arrivalExit={arrivalExit}
                    localLabel={localLabel}
                    animated={animated}
                    t={t}
                />

                <RoutePanelSegments
                    routeResult={routeResult}
                    stationLabelLanguage={stationLabelLanguage}
                    labelOpacity={labelOpacity}
                    animated={animated}
                    onNavigateToStation={onNavigateToStation}
                    t={t}
                />
            </div>
        </PanelShell>
    )
}
