import { useEffect, useMemo, useState } from 'react'
import { lineColors } from '../../config'
import { stationCodeGroups, stationCodeToData } from '../../data/generated/stationIndex'
import { getExitLandmarksForStation } from '../../data/loaders/exitLandmarkData'
import { getStationEntrancesForStation } from '../../data/loaders/stationEntranceData'
import { getStationLines } from '../../routing/navigationUtils'
import { useTheme } from '../../contexts/ThemeContext'
import { getPanelLabel, routeAlgorithmLabels, routePanelLabels } from '../../i18n/panelLabels'
import { languageTextStyle } from '../../utils/languageAnimation'
import { estimateRouteFareFromStops } from '../../data/serviceInfo'
import PanelCloseButton from '../UI/PanelCloseButton'
import PanelShell from '../UI/PanelShell'

const lineFullNames = {
    NS: 'North South Line',
    EW: 'East West Line',
    CG: 'Changi Airport Branch',
    NE: 'North East Line',
    CC: 'Circle Line',
    CE: 'Circle Line Extension',
    DT: 'Downtown Line',
    TE: 'Thomson-East Coast Line',
    BP: 'Bukit Panjang LRT',
    SE: 'Sengkang East LRT',
    SW: 'Sengkang West LRT',
    PE: 'Punggol East LRT',
    PW: 'Punggol West LRT',
}

const routeEndpointDotStyle = {
    width: '10px',
    height: '10px',
    minWidth: '10px',
    minHeight: '10px',
    flex: '0 0 10px',
    display: 'block',
    borderRadius: '50%',
    alignSelf: 'center'
}

const routeEndpointNameStyle = {
    minWidth: 0,
    lineHeight: 1.35,
    overflowWrap: 'anywhere'
}

const extraRouteLabels = {
    timeline: { en: 'Journey', zh: '行程', ta: 'பயணம்' },
    summary: { en: 'Trip summary', zh: '行程概览', ta: 'பயண சுருக்கம்' },
    depart: { en: 'Start from', zh: '从这里出发', ta: 'இங்கிருந்து தொடங்கு' },
    ride: { en: 'Take', zh: '乘坐', ta: 'ஏறு' },
    alight: { en: 'Arrive at', zh: '到达', ta: 'சென்று சேர்' },
    change: { en: 'Change at', zh: '在此换乘', ta: 'இங்கு மாறு' },
    recommendedExit: { en: 'Suggested exit', zh: '推荐出口', ta: 'பரிந்துரைக்கப்பட்ட வெளியேறு' },
    noExitInfo: { en: 'No exit landmark info available', zh: '暂无出口地标信息', ta: 'வெளியேறும் இட தகவல் இல்லை' },
    approx: { en: 'approx.', zh: '约', ta: 'சுமார்' },
    min: { en: 'min', zh: '分钟', ta: 'நிமிடம்' },
    stops: { en: 'stops', zh: '站', ta: 'நிறுத்தங்கள்' },
    via: { en: 'via', zh: '途经', ta: 'வழியாக' }
}

export default function RoutePanel({
    routeResult, navStart, navEnd,
    isRoutePanelClosing, stationLabelLanguage, labelOpacity,
    algorithm, onAlgorithmChange,
    onClose, onNavigateToStation
}) {
    const { t } = useTheme()
    const [arrivalExitState, setArrivalExitState] = useState({ stationKey: null, entrances: [], landmarks: {} })

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
        () => (arrivalExitState.stationKey === stationKey ? arrivalExitState.landmarks : {}),
        [arrivalExitState.landmarks, arrivalExitState.stationKey, stationKey]
    )
    const arrivalEntrances = useMemo(
        () => (arrivalExitState.stationKey === stationKey ? arrivalExitState.entrances : []),
        [arrivalExitState.entrances, arrivalExitState.stationKey, stationKey]
    )
    const arrivalExit = useMemo(
        () => getRecommendedExit(arrivalEntrances, arrivalExitLandmarks),
        [arrivalEntrances, arrivalExitLandmarks]
    )

    useEffect(() => {
        if (!stationKey) return

        let cancelled = false
        Promise.all([
            getStationEntrancesForStation(stationKey),
            getExitLandmarksForStation(stationKey)
        ]).then(([entrances, landmarks]) => {
            if (!cancelled) {
                setArrivalExitState({
                    stationKey,
                    entrances,
                    landmarks
                })
            }
        }).catch(() => {
            if (!cancelled) {
                setArrivalExitState({ stationKey, entrances: [], landmarks: {} })
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

            <div style={{ padding: '20px 24px 16px 24px', flexShrink: 0, position: 'relative' }}>
                <PanelCloseButton onClick={onClose} top={18} right={18} variant="glass" ariaLabel="Close route panel" />

                <div style={{ fontSize: '32px', fontWeight: 'bold', ...animated() }}>{routeLabel('title')}</div>
                <div style={{
                    marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px',
                    padding: '10px 16px', borderRadius: '999px',
                    background: lineColors[routeResult[0]?.line] || '#005ec4',
                    fontWeight: 'bold', fontSize: '17px', color: 'white',
                    boxShadow: `0 0 20px ${lineColors[routeResult[0]?.line] || '#005ec4'}55`
                }}>
                    <span style={animated()}>
                        {routeResult.reduce((sum, seg) => sum + seg.stations.length, 0)} {routeLabel('stations')}
                    </span>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0',
                    marginTop: '14px', fontSize: '12px',
                    background: t.overlayStrong, borderRadius: '8px',
                    padding: '3px', width: 'fit-content'
                }}>
                    {routeAlgorithmLabels.map(label => (
                        <button
                            key={label.key}
                            onClick={() => onAlgorithmChange(label.key)}
                            style={{
                                padding: '6px 14px', border: 'none', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '12px', fontWeight: algorithm === label.key ? 'bold' : 'normal',
                                background: algorithm === label.key ? t.panelBg : 'transparent',
                                color: t.textPrimary,
                                boxShadow: algorithm === label.key ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                                transition: 'all 0.2s'
                            }}
                        ><span style={{
                            ...animated()
                        }}>{algorithmLabel(label)}</span></button>
                    ))}
                </div>
            </div>

            <div style={{ padding: '0 24px 20px 24px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{
                    background: t.overlayMedium, padding: '12px 16px',
                    borderRadius: '10px', fontSize: '14px',
                    display: 'grid', gridTemplateColumns: '10px minmax(0, 1fr) auto',
                    columnGap: '10px', rowGap: '4px', alignItems: 'center'
                }}>
                    <span style={{ ...routeEndpointDotStyle, background: t.startDot, boxShadow: t.startDotGlow }} />
                    <span style={{ ...routeEndpointNameStyle, ...animated(labelOpacity * 0.8) }}>
                        {stationCodeToData[navStart]?.[stationLabelLanguage] || stationCodeToData[navStart]?.en}
                    </span>
                    <span style={{
                        width: '10px', minHeight: '14px', display: 'flex',
                        justifyContent: 'center', alignSelf: 'stretch', opacity: 0.35
                    }}>
                        <span style={{ width: '2px', borderRadius: '1px', background: t.textSecondary }} />
                    </span>
                    <span style={{ fontSize: '11px', color: t.textSecondary, opacity: 0.7, ...animated(labelOpacity * 0.5) }}>
                        {routeLabel('to')}
                    </span>
                    <span style={{ ...routeEndpointDotStyle, background: t.endDot, boxShadow: t.endDotGlow }} />
                    <span style={{ ...routeEndpointNameStyle, ...animated(labelOpacity * 0.8) }}>
                        {stationCodeToData[navEnd]?.[stationLabelLanguage] || stationCodeToData[navEnd]?.en}
                    </span>
                    <div style={{
                        gridColumn: 3,
                        gridRow: '1 / 4',
                        alignSelf: 'center',
                        padding: '6px 9px',
                        borderRadius: '999px',
                        background: t.overlayStrong,
                        border: `1px solid ${t.borderMedium}`,
                        color: t.textPrimary,
                        fontSize: '12px',
                        fontWeight: 800,
                        whiteSpace: 'nowrap'
                    }}>
                        {fareEstimate.distanceKm.toFixed(1)} km
                    </div>
                </div>
                <div style={{
                    background: t.overlayMedium, padding: '8px 14px',
                    borderRadius: '10px', fontSize: '14px', display: 'grid',
                    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px'
                }}>
                    <Metric label={formatMetricLabel(`${localLabel('approx')} ${localLabel('min')}`, stationLabelLanguage)} value={journeyStats.minutes} language={stationLabelLanguage} animated={animated} t={t} />
                    <Metric label={formatMetricLabel(routeLabel('stations'), stationLabelLanguage)} value={journeyStats.stops} language={stationLabelLanguage} animated={animated} t={t} />
                    <Metric label={formatMetricLabel(routeLabel(transferCount === 1 ? 'transfer' : 'transfers'), stationLabelLanguage)} value={transferCount} language={stationLabelLanguage} animated={animated} t={t} />
                    <Metric label={formatMetricLabel(fareLabel, stationLabelLanguage)} value={`S$${fareEstimate.fare.toFixed(2)}`} language={stationLabelLanguage} animated={animated} t={t} />
                </div>
            </div>

            <div className="nav-scroll" style={{ padding: '0 24px 24px 24px', overflowY: 'auto', flex: 1 }}>
                <div style={{
                    background: t.overlayLight, borderRadius: '12px',
                    padding: '18px', marginBottom: '10px'
                }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', ...animated() }}>
                        {localLabel('timeline')}
                    </div>
                    <JourneyTimelineV2
                        steps={timelineSteps}
                        stationLabelLanguage={stationLabelLanguage}
                        labelOpacity={labelOpacity}
                        animated={animated}
                        localLabel={localLabel}
                        onNavigateToStation={onNavigateToStation}
                        t={t}
                    />
                </div>

                <div style={{
                    background: t.overlayLight, borderRadius: '12px',
                    padding: '16px', marginBottom: '10px'
                }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', ...animated() }}>
                        {localLabel('recommendedExit')}
                    </div>
                    <ArrivalExitCard
                        exit={arrivalExit}
                        localLabel={localLabel}
                        animated={animated}
                        t={t}
                    />
                </div>

                {routeResult.map((segment, segIdx) => {
                    const segmentColor = lineColors[segment.line] || '#808080'
                    return (
                        <div key={segIdx} style={{
                            background: t.overlayLight, borderRadius: '12px',
                            padding: '16px', marginBottom: segIdx < routeResult.length - 1 ? '10px' : '0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <div style={{ width: '4px', height: '22px', background: segmentColor, borderRadius: '2px' }} />
                                <span style={{ fontSize: '16px', fontWeight: 'bold', color: segmentColor }}>
                                    {lineFullNames[segment.line] || `${segment.line} Line`}
                                </span>
                            </div>

                            <div style={{ position: 'relative', paddingLeft: '10px' }}>
                                <div style={{
                                    position: 'absolute', left: '13px', top: '8px', bottom: '8px',
                                    width: '2px', background: segmentColor, opacity: 0.3, borderRadius: '1px'
                                }} />

                                {segment.stations
                                    .filter((s, i, arr) => {
                                        if (i === 0) return true
                                        const prevName = stationCodeToData[arr[i - 1]]?.[stationLabelLanguage]
                                        const currName = stationCodeToData[s]?.[stationLabelLanguage]
                                        return prevName !== currName
                                    })
                                    .map((station, stnIdx) => {
                                        const stationName = stationCodeToData[station]?.[stationLabelLanguage] || station
                                        const stationLines = getStationLines(station)
                                        const isMultiLine = stationLines.length > 1

                                        return (
                                            <div key={stnIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '6px 0' }}>
                                                <div style={{
                                                    width: '8px', height: '8px', borderRadius: '50%',
                                                    background: isMultiLine ? t.panelBg : segmentColor,
                                                    border: isMultiLine ? `2px solid ${segmentColor}` : 'none',
                                                    flexShrink: 0, zIndex: 1
                                                }} />
                                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0, minWidth: '64px' }}>
                                                    {isMultiLine ? (
                                                        (() => {
                                                            const allCodes = stationCodeGroups[station] || [station]
                                                            // 首段首站：只显示与当前行驶线路匹配的 badge
                                                            const showCodes = (segIdx === 0 && stnIdx === 0)
                                                                ? allCodes.filter(c => (c.match(/^[A-Z]+/)?.[0] || '') === segment.line)
                                                                : allCodes
                                                            if (showCodes.length === 0) showCodes.push(station)
                                                            return showCodes.map(code => {
                                                                const prefix = code.match(/^[A-Z]+/)?.[0] || ''
                                                                return (
                                                                    <span key={code} style={{
                                                                        padding: '2px 0', borderRadius: '999px',
                                                                        background: lineColors[prefix] || segmentColor,
                                                                        fontSize: '10px', fontWeight: 'bold', color: 'white',
                                                                        textAlign: 'center', width: '38px', display: 'inline-block'
                                                                    }}>{code}</span>
                                                                )
                                                            })
                                                        })()
                                                    ) : (
                                                        <span style={{
                                                            padding: '2px 0', borderRadius: '999px',
                                                            background: segmentColor, fontSize: '10px',
                                                            fontWeight: 'bold', color: 'white', textAlign: 'center',
                                                            width: '46px', display: 'inline-block'
                                                        }}>{station}</span>
                                                    )}
                                                </div>
                                                <span onClick={() => onNavigateToStation(station)}
                                                    style={{
                                                        fontSize: '14px', cursor: 'pointer',
                                                        maxWidth: '140px', overflow: 'hidden',
                                                        opacity: labelOpacity,
                                                        transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s cubic-bezier(0.22,1,0.36,1)',
                                                        transform: labelOpacity === 0 ? 'translateY(4px) scale(0.95)' : 'translateY(0px) scale(1)',
                                                        filter: labelOpacity === 0 ? 'blur(4px)' : 'blur(0px)'
                                                    }}
                                                >
                                                    <span ref={(el) => {
                                                        if (!el) return
                                                        if (stationLabelLanguage === 'ta' && el.scrollWidth > 120) {
                                                            const d = Math.max(2.5, 5 - (el.scrollWidth - 120) / 15)
                                                            el.style.animation = `scrollText ${d}s linear infinite`
                                                        } else {
                                                            el.style.animation = 'none'
                                                        }
                                                    }} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                                                    >{stationName}</span>
                                                </span>
                                            </div>
                                        )
                                    })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </PanelShell>
    )
}

function Metric({ label, value, language, animated, t }) {
    return (
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', lineHeight: 1 }}>{value}</div>
            <div style={{
                marginTop: '3px', fontSize: '12px', fontWeight: 700, color: t.textSecondary,
                whiteSpace: 'nowrap', overflow: 'hidden',
                ...animated(0.55)
            }}>
                <span
                    ref={(el) => {
                        if (!el) return
                        const parentWidth = el.parentElement?.clientWidth || 0
                        if (language === 'ta' && parentWidth > 0 && el.scrollWidth > parentWidth) {
                            el.style.setProperty('--scroll-container-width', `${parentWidth}px`)
                            const duration = Math.max(2.8, 5 - (el.scrollWidth - parentWidth) / 18)
                            el.style.animation = `scrollInlineText ${duration}s linear infinite`
                        } else {
                            el.style.animation = 'none'
                            el.style.removeProperty('--scroll-container-width')
                        }
                    }}
                    style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                >
                    {label}
                </span>
            </div>
        </div>
    )
}

function formatMetricLabel(label, language) {
    if (language !== 'en') return label
    return String(label)
        .replace(/\b[a-z]/g, char => char.toUpperCase())
        .replace('Approx.', 'Approx')
}

function getTransferNote(step, language) {
    const line = step.line || ''
    const stationLines = getStationLines(step.station)
    const isLrtTransfer = ['BP', 'SE', 'SW', 'PE', 'PW'].includes(line)
    const isSameStation = stationLines.length > 1

    if (language === 'zh') {
        if (isLrtTransfer) return `换乘至 ${line} 轻轨环线，请留意方向与站台指示。`
        if (isSameStation) return `同站换乘至 ${line} 线，跟随站内指示前往对应站台。`
        return `换乘至 ${line} 线，请按站内指示前往下一段站台。`
    }

    if (language === 'ta') {
        if (isLrtTransfer) return `${line} LRT வளையத்திற்கு மாறவும். திசை மற்றும் நடைமேடை குறிகளைப் பார்க்கவும்.`
        if (isSameStation) return `அதே நிலையத்தில் ${line} வழித்தடத்திற்கு மாறவும். நிலைய குறிகளைப் பின்பற்றவும்.`
        return `${line} வழித்தடத்திற்கு மாறவும். அடுத்த நடைமேடைக்கு நிலைய குறிகளைப் பின்பற்றவும்.`
    }

    if (isLrtTransfer) return `Change to the ${line} LRT loop. Check direction and platform signs.`
    if (isSameStation) return `Same-station transfer to the ${line} Line. Follow signs to the platform.`
    return `Change to the ${line} Line. Follow station signs to the next platform.`
}

function RouteLineBadge({ line, color }) {
    return (
        <span style={{
            background: color,
            padding: '5px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            lineHeight: 1,
            fontWeight: 'bold',
            color: 'white',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            boxShadow: `0 0 8px ${color}44`
        }}>{line}</span>
    )
}

function JourneyTimelineV2({ steps, stationLabelLanguage, labelOpacity, animated, localLabel, onNavigateToStation, t }) {
    return (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {steps.map((step, index) => {
                const color = step.line ? lineColors[step.line] || '#808080' : t.textSecondary
                const stationName = getStationName(step.station, stationLabelLanguage)
                const endStationName = step.endStation ? getStationName(step.endStation, stationLabelLanguage) : ''
                const isRide = step.type === 'ride'
                const isTransfer = step.type === 'transfer'
                const transferNote = isTransfer ? getTransferNote(step, stationLabelLanguage) : ''

                return (
                    <div key={`${step.type}-${step.station}-${index}`} style={{
                        display: 'grid',
                        gridTemplateColumns: '26px minmax(0, 1fr)',
                        columnGap: '12px',
                        alignItems: 'stretch'
                    }}>
                        <div style={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'center',
                            paddingTop: '8px'
                        }}>
                            {index < steps.length - 1 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '24px',
                                    bottom: '-18px',
                                    width: '2px',
                                    borderRadius: '1px',
                                    background: isRide ? color : t.textSecondary,
                                    opacity: isRide ? 0.55 : 0.2
                                }} />
                            )}
                            <span style={{
                                width: isRide ? '18px' : '14px',
                                height: isRide ? '18px' : '14px',
                                borderRadius: '50%',
                                background: isTransfer ? t.panelBg : color,
                                border: isTransfer ? `3px solid ${color}` : `2px solid ${t.panelBg}`,
                                boxShadow: isRide ? `0 0 14px ${color}66` : 'none',
                                zIndex: 1
                            }} />
                        </div>

                        <div style={{
                            minWidth: 0,
                            padding: isRide ? '12px 14px' : '10px 0',
                            borderRadius: isRide ? '10px' : 0,
                            background: isRide ? t.overlayMedium : 'transparent',
                            borderLeft: isRide ? `4px solid ${color}` : 'none'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '7px',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: step.line ? color : t.textPrimary,
                                ...animated()
                            }}>
                                {step.line && (
                                    <RouteLineBadge line={step.line} color={color} />
                                )}
                                <span>{localLabel(step.labelKey)}</span>
                            </div>

                            <div style={{
                                marginTop: '6px',
                                fontSize: isRide ? '15px' : '14px',
                                fontWeight: isRide ? 700 : 500,
                                lineHeight: 1.35,
                                opacity: labelOpacity,
                                transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s cubic-bezier(0.22,1,0.36,1)',
                                transform: labelOpacity === 0 ? 'translateY(4px) scale(0.95)' : 'translateY(0px) scale(1)',
                                filter: labelOpacity === 0 ? 'blur(4px)' : 'blur(0px)'
                            }}>
                                <button
                                    onClick={() => onNavigateToStation(step.station)}
                                    style={{
                                        border: 'none',
                                        padding: 0,
                                        background: 'transparent',
                                        color: t.textPrimary,
                                        cursor: 'pointer',
                                        font: 'inherit',
                                        fontWeight: 'inherit',
                                        textAlign: 'left'
                                    }}
                                >{stationName}</button>
                                {isRide && (
                                    <>
                                        <span style={{ color: t.textSecondary, fontWeight: 600 }}> {'->'} </span>
                                        <span>{endStationName}</span>
                                        <div style={{
                                            marginTop: '6px',
                                            fontSize: '12px',
                                            color: t.textSecondary,
                                            fontWeight: 600
                                        }}>
                                            {step.stopCount} {localLabel('stops')}
                                        </div>
                                    </>
                                )}
                                {isTransfer && transferNote && (
                                    <div style={{
                                        marginTop: '6px',
                                        fontSize: '12px',
                                        lineHeight: 1.4,
                                        color: t.textSecondary,
                                        fontWeight: 600
                                    }}>
                                        {transferNote}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function ArrivalExitCard({ exit, localLabel, animated, t }) {
    if (!exit) {
        return (
            <div style={{ fontSize: '13px', color: t.textSecondary, ...animated(0.65) }}>
                {localLabel('noExitInfo')}
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{
                flex: '0 0 auto', minWidth: '48px', padding: '6px 10px',
                borderRadius: '999px', background: t.entranceMarker,
                color: '#111', fontSize: '12px', fontWeight: 'bold',
                textAlign: 'center', whiteSpace: 'nowrap'
            }}>
                {exit.name}
            </div>
            <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', lineHeight: 1.35, ...animated(0.8) }}>
                    {exit.landmarks.slice(0, 3).map(item => item.name).join(' · ')}
                </div>
                {exit.landmarks.length > 3 && (
                    <div style={{ marginTop: '4px', fontSize: '11px', color: t.textSecondary }}>
                        +{exit.landmarks.length - 3} {String(localLabel('via')).toLowerCase()}
                    </div>
                )}
            </div>
        </div>
    )
}

function buildTimelineSteps(routeResult = []) {
    if (!routeResult?.length) return []

    const steps = []
    routeResult.forEach((segment, index) => {
        const start = segment.stations[0]
        const end = segment.stations[segment.stations.length - 1]
        const stopCount = Math.max(0, segment.stations.length - 1)

        if (index === 0) {
            steps.push({ type: 'depart', labelKey: 'depart', station: start })
        } else {
            steps.push({ type: 'transfer', labelKey: 'change', station: start, line: segment.line })
        }

        steps.push({
            type: 'ride',
            labelKey: 'ride',
            line: segment.line,
            station: start,
            endStation: end,
            stopCount
        })

        if (index === routeResult.length - 1) {
            steps.push({ type: 'arrive', labelKey: 'alight', station: end })
        }
    })

    return steps
}

function getJourneyStats(routeResult = [], transferCount = 0) {
    const stops = routeResult.reduce((sum, segment) => sum + Math.max(0, segment.stations.length - 1), 0)
    const minutes = Math.max(1, Math.round(stops * 2 + Math.max(0, transferCount) * 5 + 2))

    return { stops, minutes }
}

function getStationName(stationCode, language) {
    return stationCodeToData[stationCode]?.[language] || stationCodeToData[stationCode]?.en || stationCode
}

function getStationKey(stationCode) {
    const codes = stationCodeGroups[stationCode] || (stationCode ? [stationCode] : [])
    return codes.join('-')
}

function getRecommendedExit(entrances, landmarksByExit) {
    const rankedEntrances = [...(entrances || [])]
    if (!rankedEntrances.length) return null

    rankedEntrances.sort((a, b) => naturalExitSort(a.name, b.name))

    const ranked = rankedEntrances
        .map(entrance => ({
            name: entrance.name,
            landmarks: landmarksByExit[entrance.name] || []
        }))
        .sort((a, b) => {
            if (b.landmarks.length !== a.landmarks.length) return b.landmarks.length - a.landmarks.length
            return naturalExitSort(a.name, b.name)
        })

    return ranked.find(item => item.landmarks.length > 0) || null
}

function naturalExitSort(a, b) {
    const ia = parseInt(a), ib = parseInt(b)
    if (!isNaN(ia) && !isNaN(ib)) return ia - ib
    if (!isNaN(ia)) return -1
    if (!isNaN(ib)) return 1
    return String(a).localeCompare(String(b))
}
