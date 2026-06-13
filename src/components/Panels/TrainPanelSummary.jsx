import { lineColors } from '../../config'
import { getLineFullName } from './trainPanelUtils'

export default function TrainPanelSummary({
    t,
    trainData,
    lineColor,
    activeCodes,
    activeName,
    atStation,
    stationName,
    animated,
    labels
}) {
    return (
        <>
            <div style={{ padding: '20px 24px 16px 24px', flexShrink: 0, position: 'relative' }}>
                <div style={{ fontSize: '14px', ...animated(0.5) }}>
                    {labels.train}
                </div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', marginTop: '2px' }}>
                    {trainData.trainNum}
                </div>

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

            <div style={{ padding: '0 24px 16px 24px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{
                    background: t.overlayMedium, padding: '12px 16px',
                    borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <span style={{ ...animated(0.6), flexShrink: 0 }}>{labels.to}</span>
                    <span style={{ fontWeight: 'bold', ...animated() }}>
                        {stationName(trainData.termCode)}
                    </span>
                </div>

                <div style={{
                    background: t.overlayMedium, padding: '12px 16px',
                    borderRadius: '10px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <span style={{ ...animated(0.6), flexShrink: 0 }}>{atStation ? labels.current : labels.next}</span>
                    <span style={{ fontWeight: 'bold', ...animated() }}>
                        {activeName}
                    </span>
                    {atStation && trainData.waitTimer > 0 && (
                        <span style={{ fontSize: '12px', opacity: 0.5, flexShrink: 0 }}>
                            ({Math.ceil(trainData.waitTimer)}s)
                        </span>
                    )}
                    <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto', flexShrink: 0 }}>
                        {activeCodes.map(code => {
                            const prefix = code.match(/^[A-Z]+/)?.[0] || ''
                            return (
                                <span key={code} style={{
                                    background: lineColors[prefix] || lineColor,
                                    padding: '2px 8px', borderRadius: '999px',
                                    fontSize: '10px', fontWeight: 'bold', color: 'white'
                                }}>{code}</span>
                            )
                        })}
                    </div>
                </div>
            </div>
        </>
    )
}
