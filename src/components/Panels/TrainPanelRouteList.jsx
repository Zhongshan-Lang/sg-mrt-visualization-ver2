export default function TrainPanelRouteList({
    t,
    lineColor,
    orderedStations,
    stations,
    activeIndex,
    direction,
    labelOpacity,
    animated,
    stationName,
    stationETAs,
    routeLabel,
    listRef
}) {
    if (!orderedStations.length) return null

    return (
        <div ref={listRef} className="nav-scroll" style={{ padding: '0 24px 20px 24px', overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', ...animated(0.5) }}>
                <span style={{ ...animated() }}>{routeLabel}</span>
            </div>
            <div style={{ position: 'relative', paddingLeft: '10px' }}>
                <div style={{
                    position: 'absolute', left: '13px', top: '8px', bottom: '8px',
                    width: '2px', background: lineColor, opacity: 0.3, borderRadius: '1px'
                }} />
                {orderedStations.map(station => {
                    const code = station.code
                    const name = stationName(code)
                    const originalIndex = stations.indexOf(station)
                    const isActive = originalIndex === activeIndex
                    const isPassed = direction === 1
                        ? originalIndex < activeIndex
                        : originalIndex > activeIndex

                    return (
                        <div key={code} data-stn-idx={originalIndex} style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '4px 0'
                        }}>
                            <div style={{
                                width: isActive ? '10px' : '8px',
                                height: isActive ? '10px' : '8px',
                                borderRadius: '50%',
                                background: isActive ? lineColor : t.overlayMedium,
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
    )
}
