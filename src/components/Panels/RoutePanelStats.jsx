import { routeEndpointDotStyle, routeEndpointNameStyle, formatMetricLabel } from './routePanelUtils'

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

export default function RoutePanelStats({
    navStart,
    navEnd,
    stationLabelLanguage,
    labelOpacity,
    routeLabel,
    localLabel,
    fareLabel,
    transferCount,
    journeyStats,
    fareEstimate,
    stationCodeToData,
    animated,
    t
}) {
    return (
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
    )
}
