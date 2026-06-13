import { lineColors } from '../../config'
import { stationCodeGroups, stationCodeToData } from '../../data/generated/stationIndex'
import { getStationLines } from '../../routing/navigationUtils'
import { lineFullNames } from './routePanelUtils'

export default function RoutePanelSegments({
    routeResult,
    stationLabelLanguage,
    labelOpacity,
    onNavigateToStation,
    t
}) {
    return routeResult.map((segment, segIdx) => {
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
                                    <span
                                        onClick={() => onNavigateToStation(station)}
                                        style={{
                                            fontSize: '14px', cursor: 'pointer',
                                            maxWidth: '140px', overflow: 'hidden',
                                            opacity: labelOpacity,
                                            transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s cubic-bezier(0.22,1,0.36,1)',
                                            transform: labelOpacity === 0 ? 'translateY(4px) scale(0.95)' : 'translateY(0px) scale(1)',
                                            filter: labelOpacity === 0 ? 'blur(4px)' : 'blur(0px)'
                                        }}
                                    >
                                        <span
                                            ref={(el) => {
                                                if (!el) return
                                                if (stationLabelLanguage === 'ta' && el.scrollWidth > 120) {
                                                    const duration = Math.max(2.5, 5 - (el.scrollWidth - 120) / 15)
                                                    el.style.animation = `scrollText ${duration}s linear infinite`
                                                } else {
                                                    el.style.animation = 'none'
                                                }
                                            }}
                                            style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                                        >{stationName}</span>
                                    </span>
                                </div>
                            )
                        })}
                </div>
            </div>
        )
    })
}
