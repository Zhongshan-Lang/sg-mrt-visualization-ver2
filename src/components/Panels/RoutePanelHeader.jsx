import { lineColors } from '../../config'
import { routeAlgorithmLabels } from '../../i18n/panelLabels'

export default function RoutePanelHeader({
    routeResult,
    algorithm,
    onAlgorithmChange,
    routeLabel,
    algorithmLabel,
    animated,
    t
}) {
    const primaryColor = lineColors[routeResult[0]?.line] || '#005ec4'
    const stationCount = routeResult.reduce((sum, seg) => sum + seg.stations.length, 0)

    return (
        <div style={{ padding: '20px 24px 16px 24px', flexShrink: 0, position: 'relative' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', ...animated() }}>{routeLabel('title')}</div>
            <div style={{
                marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '10px 16px', borderRadius: '999px',
                background: primaryColor,
                fontWeight: 'bold', fontSize: '17px', color: 'white',
                boxShadow: `0 0 20px ${primaryColor}55`
            }}>
                <span style={animated()}>
                    {stationCount} {routeLabel('stations')}
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
                    >
                        <span style={{ ...animated() }}>{algorithmLabel(label)}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
