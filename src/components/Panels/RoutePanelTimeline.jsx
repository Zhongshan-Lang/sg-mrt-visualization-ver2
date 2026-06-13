import { lineColors } from '../../config'
import { getStationName, getTransferNote } from './routePanelUtils'

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

function JourneyTimeline({ steps, stationLabelLanguage, labelOpacity, animated, localLabel, onNavigateToStation, t }) {
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
                                {step.line && <RouteLineBadge line={step.line} color={color} />}
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

export default function RoutePanelTimeline({
    steps,
    stationLabelLanguage,
    labelOpacity,
    animated,
    localLabel,
    onNavigateToStation,
    t
}) {
    return (
        <div style={{
            background: t.overlayLight, borderRadius: '12px',
            padding: '18px', marginBottom: '10px'
        }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', ...animated() }}>
                {localLabel('timeline')}
            </div>
            <JourneyTimeline
                steps={steps}
                stationLabelLanguage={stationLabelLanguage}
                labelOpacity={labelOpacity}
                animated={animated}
                localLabel={localLabel}
                onNavigateToStation={onNavigateToStation}
                t={t}
            />
        </div>
    )
}
