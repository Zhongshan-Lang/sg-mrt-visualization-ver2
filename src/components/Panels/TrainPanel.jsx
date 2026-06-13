import { useState, useEffect, useRef } from 'react'
import { lineColors } from '../../config'
import { stationCodeToData, stationCodeGroups } from '../../data/generated/stationIndex'
import { linePropertiesByCode } from '../../data/generated/lineIndex'
import { useTheme } from '../../contexts/ThemeContext'
import { getLocalizedLabel, trainPanelLabels, trainTrackingViewLabels } from '../../i18n/trainPanelLabels'
import PanelCloseButton from '../UI/PanelCloseButton'
import PanelShell from '../UI/PanelShell'

function getAllCodesForStation(code) {
    if (!code) return []
    return stationCodeGroups[code] || [code]
}

function getLineFullName(routeKey) {
    const c = routeKey.replace('_MAIN','').replace('_CG','').replace('_CE','')
    return linePropertiesByCode[c]?.name || routeKey
}

const languageTransition = 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s cubic-bezier(0.22,1,0.36,1)'

function animatedLanguageStyle(labelOpacity, opacity = labelOpacity) {
    return {
        opacity,
        transition: languageTransition,
        transform: labelOpacity === 0 ? 'translateY(4px) scale(0.95)' : 'translateY(0px) scale(1)',
        filter: labelOpacity === 0 ? 'blur(4px)' : 'blur(0px)'
    }
}

export default function TrainPanel({
    trainData, isTrainPanelClosing,
    stationLabelLanguage, labelOpacity,
    onClose
}) {
    const { t } = useTheme()
    const listRef = useRef(null)
    const [trackingView, setTrackingView] = useState('bird')
    const activeTrainData = trainData || {}
    const lineColor = activeTrainData.lineColor || '#808080'
    const stations = activeTrainData.stations || []
    const dir = activeTrainData.direction || 1
    const atStation = Boolean(activeTrainData.waitTimer > 0 || activeTrainData.braking)
    const activeIdx = atStation
        ? activeTrainData.currentStationIndex
        : activeTrainData.currentStationIndex + dir
    const activeCode = atStation ? activeTrainData.curCode : activeTrainData.nextCode
    const activeCodes = getAllCodesForStation(activeCode)
    const orderedStations = dir === 1 ? stations : [...stations].reverse()
    const cruisingSpeed = activeTrainData.targetSpeed || 0.01
    const stationETAs = {}

    const switchView = (mode) => {
        setTrackingView(mode)
        if (window.__trainSystem) window.__trainSystem.setTrackingView(mode)
    }

    const ul = (key) => getLocalizedLabel(trainPanelLabels, key, stationLabelLanguage)
    const stationName = (code) => stationCodeToData[code]?.[stationLabelLanguage] || code
    const animated = (opacity = labelOpacity) => animatedLanguageStyle(labelOpacity, opacity)
    const activeName = stationName(activeCode)
    const DWELL = 25

    let cumSec = atStation ? activeTrainData.waitTimer : 0
    let prevDist = activeTrainData.distance
    for (const stn of orderedStations) {
        const origIdx = stations.indexOf(stn)
        const isAhead = dir === 1 ? origIdx >= activeIdx : origIdx <= activeIdx
        if (isAhead) {
            const segDist = Math.abs(stn.distance - prevDist)
            cumSec += segDist / cruisingSpeed
            if (cumSec > 0) cumSec += DWELL // dwell at this station
            stationETAs[stn.code] = Math.max(0, Math.round(cumSec / 60))
            prevDist = stn.distance
        }
    }

    useEffect(() => {
        if (!trainData || !listRef.current || activeIdx == null) return
        const el = listRef.current.querySelector(`[data-stn-idx="${activeIdx}"]`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [activeIdx, trainData])

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

            <div style={{ padding: '20px 24px 16px 24px', flexShrink: 0, position: 'relative' }}>
                <PanelCloseButton onClick={onClose} ariaLabel="Close train panel" />

                <div style={{ fontSize: '14px', ...animated(labelOpacity * 0.5) }}>
                    {ul('train')}
                </div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '2px' }}>
                    {trainData.trainNum}
                </div>

                {/* Line badge */}
                <div style={{
                    marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px',
                    padding: '10px 16px', borderRadius: '999px',
                    background: lineColor,
                    fontWeight: 'bold', fontSize: '15px', color: 'white',
                    boxShadow: `0 0 20px ${lineColor}55`
                }}>
                    {getLineFullName(trainData.routeKey)}
                </div>
            </div>

            {/* Info section */}
            <div style={{ padding: '0 24px 16px 24px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                    background: t.overlayMedium, padding: '12px 16px',
                    borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <span style={{
                        ...animated(labelOpacity * 0.6), flexShrink: 0
                    }}>{ul('to')}</span>
                    <span style={{
                        fontWeight: 'bold',
                        ...animated()
                    }}>
                        {stationName(trainData.termCode)}
                    </span>
                </div>

                <div style={{
                    background: t.overlayMedium, padding: '12px 16px',
                    borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <span style={{
                        ...animated(labelOpacity * 0.6), flexShrink: 0
                    }}>{atStation ? ul('current') : ul('next')}</span>
                    <span style={{
                        fontWeight: 'bold',
                        ...animated()
                    }}>
                        {activeName}
                    </span>
                    {atStation && trainData.waitTimer > 0 && (
                        <span style={{ fontSize: '12px', opacity: 0.5, flexShrink: 0 }}>
                            ({Math.ceil(trainData.waitTimer)}s)
                        </span>
                    )}
                    <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', flexShrink: 0 }}>
                        {activeCodes.map(c => {
                            const prefix = c.match(/^[A-Z]+/)?.[0] || ''
                            return (
                                <span key={c} style={{
                                    background: lineColors[prefix] || lineColor,
                                    padding: '2px 8px', borderRadius: '999px',
                                    fontSize: '10px', fontWeight: 'bold', color: 'white'
                                }}>{c}</span>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* View toggle */}
            <div style={{ padding: '0 24px 10px 24px', flexShrink: 0 }}>
                <div style={{
                    display: 'flex', gap: '0', background: t.overlayStrong,
                    borderRadius: '8px', padding: '3px', width: 'fit-content'
                }}>
                    {trainTrackingViewLabels.map(v => (
                        <button key={v.key} onClick={() => switchView(v.key)} style={{
                            padding: '5px 12px', border: 'none', borderRadius: '6px',
                            cursor: 'pointer', fontSize: '11px',
                            fontWeight: trackingView === v.key ? 'bold' : 'normal',
                            background: trackingView === v.key ? t.panelBg : 'transparent',
                            color: t.textPrimary,
                            boxShadow: trackingView === v.key ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                            transition: 'all 0.2s'
                        }}><span style={{
                            ...animated()
                        }}>{v[stationLabelLanguage] || v.en}</span></button>
                    ))}
                </div>
            </div>

            {/* Full line stations list */}
            {orderedStations.length > 0 && (
                <div ref={listRef} className="nav-scroll" style={{ padding: '0 24px 20px 24px', overflowY: 'auto', flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', ...animated(labelOpacity * 0.5) }}>
                        <span style={{
                            ...animated()
                        }}>{ul('route')}</span>
                    </div>
                    <div style={{ position: 'relative', paddingLeft: '10px' }}>
                        <div style={{
                            position: 'absolute', left: '13px', top: '8px', bottom: '8px',
                            width: '2px', background: lineColor, opacity: 0.3, borderRadius: '1px'
                        }} />
                        {orderedStations.map((stn) => {
                            const code = stn.code
                            const name = stationName(code)
                            const origIdx = stations.indexOf(stn)
                            const isActive = origIdx === activeIdx
                            const isPassed = dir === 1
                                ? origIdx < activeIdx
                                : origIdx > activeIdx
                            return (
                                <div key={code} data-stn-idx={origIdx} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '4px 0'
                                }}>
                                    <div style={{
                                        width: isActive ? '10px' : '8px',
                                        height: isActive ? '10px' : '8px',
                                        borderRadius: '50%',
                                        background: isActive ? lineColor : isPassed ? t.overlayMedium : t.overlayMedium,
                                        border: isActive ? `2px solid ${lineColor}` : `1.5px solid ${t.borderStrong}`,
                                        flexShrink: 0, zIndex: 1
                                    }} />
                                    <span style={{
                                        padding: '2px 0', borderRadius: '999px',
                                        background: isActive ? lineColor : 'transparent',
                                        fontSize: '10px', fontWeight: 'bold',
                                        color: isActive ? 'white' : t.textSecondary,
                                        textAlign: 'center', width: '46px',
                                        display: 'inline-block', flexShrink: 0,
                                        opacity: isPassed ? 0.4 : 1
                                    }}>{code}</span>
                                    <span style={{
                                        fontSize: '13px', flex: 1,
                                        ...animated(isPassed ? 0.3 : (isActive ? labelOpacity : labelOpacity * 0.7))
                                    }}>{name}</span>
                                    {!isPassed && stationETAs[code] != null && (
                                        <span style={{
                                            fontSize: '11px', opacity: 0.5, flexShrink: 0,
                                            minWidth: '36px', textAlign: 'right'
                                        }}>
                                            {stationETAs[code] === 0 ? '<1' : stationETAs[code]} min
                                        </span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </PanelShell>
    )
}
