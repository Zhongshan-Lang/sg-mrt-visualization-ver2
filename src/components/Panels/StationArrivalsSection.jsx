import { lineColors } from '../../config'
import { groupArrivalsByTerminal, getStationLabel } from './stationPanelUtils'

export default function StationArrivalsSection({
    arrivals,
    stationLabelLanguage,
    labelOpacity,
    animated,
    panelLabel,
    t
}) {
    if (!arrivals.length) return null

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', ...animated(labelOpacity * 0.8) }}>
                {panelLabel('nextTrains')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {groupArrivalsByTerminal(arrivals).map((group, index) => {
                    const terminalName = getStationLabel(group.terminal, stationLabelLanguage)
                    return (
                        <div
                            key={index}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: t.overlayMedium, padding: '8px 12px', borderRadius: '8px'
                            }}
                        >
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: lineColors[group.line] || group.lineColor, flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', fontWeight: '600', color: lineColors[group.line] || group.lineColor }}>{group.line}</span>
                            <span style={{
                                fontSize: '11px', opacity: labelOpacity * 0.5,
                                transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s cubic-bezier(0.22,1,0.36,1)',
                                transform: labelOpacity === 0 ? 'translateY(4px) scale(0.95)' : 'translateY(0px) scale(1)',
                                filter: labelOpacity === 0 ? 'blur(4px)' : 'blur(0px)'
                            }}>{panelLabel('to')}&nbsp;&nbsp;{terminalName}</span>
                            <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.7 }}>
                                {group.trains.map((train, trainIndex) => (
                                    <span key={trainIndex}>{trainIndex > 0 ? ' · ' : ''}{train.etaMin} min</span>
                                ))}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
