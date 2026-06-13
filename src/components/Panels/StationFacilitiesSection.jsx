import { useState } from 'react'
import { localServiceLabel, stationFacilityLabels } from '../../data/serviceInfo'
import { languageTextStyle } from '../../utils/languageAnimation'

export default function StationFacilitiesSection({ facilities, language, labelOpacity, t }) {
    const [expanded, setExpanded] = useState(false)
    const title = localServiceLabel(stationFacilityLabels, 'title', language)
    const visibleFacilities = expanded ? facilities : facilities.slice(0, 4)
    const toggleLabel = expanded
        ? ({ en: 'Less', zh: '收起', ta: 'குறை' }[language] || 'Less')
        : ({ en: 'More', zh: '展开', ta: 'மேலும்' }[language] || 'More')

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '10px',
                ...languageTextStyle(labelOpacity, labelOpacity * 0.8)
            }}>
                <span>{title}</span>
                <button
                    onClick={() => setExpanded(prev => !prev)}
                    style={{
                        border: `1px solid ${t.borderMedium}`,
                        background: t.overlayMedium,
                        color: t.textPrimary,
                        borderRadius: '999px',
                        padding: '5px 10px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap'
                    }}
                >
                    {toggleLabel}
                </button>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '8px',
                transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)'
            }}>
                {visibleFacilities.map(item => {
                    const label = localServiceLabel(stationFacilityLabels, item.key, language)
                    const status = localServiceLabel(stationFacilityLabels, item.status, language)
                    const isAvailable = item.status === 'available'
                    return (
                        <div
                            key={item.key}
                            style={{
                                gridColumn: item.wide ? '1 / -1' : 'auto',
                                background: t.overlayMedium,
                                border: `1px solid ${isAvailable ? t.borderMedium : t.borderLight}`,
                                borderRadius: '10px',
                                padding: item.wide ? '10px 12px' : '9px 10px',
                                minWidth: 0
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '7px',
                                minWidth: 0
                            }}>
                                <span style={{
                                    width: '7px',
                                    height: '7px',
                                    borderRadius: '50%',
                                    background: isAvailable ? t.startDot : t.textSecondary,
                                    boxShadow: isAvailable ? t.startDotGlow : 'none',
                                    flexShrink: 0
                                }} />
                                <span style={{
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: t.textPrimary,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    ...languageTextStyle(labelOpacity)
                                }}>
                                    {label}
                                </span>
                            </div>
                            <div style={{
                                marginTop: '5px',
                                fontSize: item.wide ? '11px' : '10px',
                                lineHeight: 1.35,
                                color: t.textSecondary,
                                ...languageTextStyle(labelOpacity, labelOpacity * 0.65)
                            }}>
                                {status}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
