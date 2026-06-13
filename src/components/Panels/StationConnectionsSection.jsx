import { lineColors } from '../../config'
import { stationCodeToData } from '../../data/generated/stationIndex'

export default function StationConnectionsSection({
    stationConnections,
    stationLabelLanguage,
    labelOpacity,
    animated,
    panelLabel,
    onNavigateToStation,
    t
}) {
    return (
        <>
            <div style={{ marginTop: '20px', fontSize: '16px', fontWeight: 'bold', ...animated(labelOpacity * 0.8) }}>
                {panelLabel('route')}
            </div>
            <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {stationConnections.map((item, index) => {
                    const connectionKey = `${item.lineCode}-${item.stations?.current || index}${item._branch ? '-branch' : ''}`
                    if (!item.stations) return null
                    const color = lineColors[item.lineCode]
                    const nodes = [item.stations.prev, item.stations.current, item.stations.next].filter(Boolean)
                    return (
                        <div key={connectionKey}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '14px' }}>
                                {nodes.map((station, i) => {
                                    const isCurrent = station === item.stations.current
                                    return (
                                        <div key={`${item.lineCode}-${station}-${i}`} style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{ width: '85px', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                                <div style={{
                                                    fontSize: '13px', fontWeight: 500, textAlign: 'center',
                                                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                                                    marginBottom: '8px', lineHeight: '16px', whiteSpace: 'nowrap',
                                                    width: stationLabelLanguage === 'ta' ? '100px' : 'auto',
                                                    overflow: stationLabelLanguage === 'ta' ? 'hidden' : 'visible',
                                                    opacity: labelOpacity,
                                                    transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s cubic-bezier(0.22,1,0.36,1)',
                                                    transform: labelOpacity === 0 ? 'translateY(8px) scale(0.92)' : 'translateY(0px) scale(1)',
                                                    filter: labelOpacity === 0 ? 'blur(6px)' : 'blur(0px)'
                                                }}>
                                                    <span
                                                        ref={(el) => {
                                                            if (!el) return
                                                            if (stationLabelLanguage === 'ta' && el.scrollWidth > 100) {
                                                                const duration = Math.max(2.5, 5 - (el.scrollWidth - 100) / 15)
                                                                el.style.animation = `scrollText ${duration}s linear infinite`
                                                                el.parentElement.style.justifyContent = 'flex-start'
                                                            } else {
                                                                el.style.animation = 'none'
                                                                if (stationLabelLanguage !== 'ta') el.parentElement.style.justifyContent = 'center'
                                                            }
                                                        }}
                                                        style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                                                    >
                                                        {stationCodeToData[station]?.[stationLabelLanguage]}
                                                    </span>
                                                </div>
                                                <div
                                                    onClick={() => { if (!isCurrent) onNavigateToStation(station) }}
                                                    onMouseEnter={(event) => {
                                                        if (!isCurrent) {
                                                            event.currentTarget.style.transform = 'scale(1.12)'
                                                            event.currentTarget.style.boxShadow = `0 0 14px ${color}`
                                                        }
                                                    }}
                                                    onMouseLeave={(event) => {
                                                        if (!isCurrent) {
                                                            event.currentTarget.style.transform = 'scale(1)'
                                                            event.currentTarget.style.boxShadow = 'none'
                                                        }
                                                    }}
                                                    style={{
                                                        width: isCurrent ? '58px' : '46px',
                                                        height: isCurrent ? '34px' : '28px',
                                                        borderRadius: '999px',
                                                        background: isCurrent ? color : t.overlayMedium,
                                                        border: `2px solid ${color}`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 'bold', fontSize: isCurrent ? '12px' : '10px',
                                                        color: isCurrent ? 'white' : t.textPrimary,
                                                        boxShadow: isCurrent ? `0 0 18px ${color}` : 'none',
                                                        transition: 'transform 0.25s, box-shadow 0.25s',
                                                        cursor: isCurrent ? 'default' : 'pointer'
                                                    }}
                                                >{station}</div>
                                            </div>
                                            {i !== nodes.length - 1 && (
                                                <div style={{
                                                    width: '65px', height: '4px', background: color,
                                                    opacity: 0.9, borderRadius: '999px', flexShrink: 0, marginTop: '35px'
                                                }} />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>
        </>
    )
}
