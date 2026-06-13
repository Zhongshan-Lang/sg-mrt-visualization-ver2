import { trainTrackingViewLabels } from '../../i18n/trainPanelLabels'

export default function TrainPanelViewToggle({
    t,
    trackingView,
    stationLabelLanguage,
    animated,
    onSwitchView
}) {
    return (
        <div style={{ padding: '0 24px 10px 24px', flexShrink: 0 }}>
            <div style={{
                display: 'flex', gap: '0', background: t.overlayStrong,
                borderRadius: '8px', padding: '3px', width: 'fit-content'
            }}>
                {trainTrackingViewLabels.map(view => (
                    <button
                        key={view.key}
                        onClick={() => onSwitchView(view.key)}
                        style={{
                            padding: '5px 12px', border: 'none', borderRadius: '6px',
                            cursor: 'pointer', fontSize: '11px',
                            fontWeight: trackingView === view.key ? 'bold' : 'normal',
                            background: trackingView === view.key ? t.panelBg : 'transparent',
                            color: t.textPrimary,
                            boxShadow: trackingView === view.key ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <span style={{ ...animated() }}>{view[stationLabelLanguage] || view.en}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
