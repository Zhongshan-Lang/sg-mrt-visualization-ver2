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

export default function RoutePanelExitSection({ arrivalExit, localLabel, animated, t }) {
    return (
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
    )
}
