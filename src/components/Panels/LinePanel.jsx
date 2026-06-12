import { stationCodeToData } from '../../data/generated/stationIndex'
import { generatedLineSequences } from '../../data/generated/lineIndex'
import { useTheme } from '../../contexts/ThemeContext'
import { languageTextStyle } from '../../utils/languageAnimation'
import { getPanelLabel, linePanelLabels } from '../../i18n/panelLabels'
import { isLrtLine } from '../../routing/specialLineRules'
import { getLineStory } from '../../data/lineStories'
import PanelCloseButton from '../UI/PanelCloseButton'
import PanelShell from '../UI/PanelShell'

export default function LinePanel({
    selectedLine, isLineClosing, isEntering,
    onClose, stationLabelLanguage, labelOpacity,
    onNavigateToStation
}) {
    const { t } = useTheme()
    if (!selectedLine) return null
    const animated = (opacity = labelOpacity) => languageTextStyle(labelOpacity, opacity)
    const panelLabel = (key) => getPanelLabel(linePanelLabels, key, stationLabelLanguage)

    const sequence = generatedLineSequences[selectedLine.code] || []
    const length = selectedLine.length || selectedLine.shape_len || null
    const story = getLineStory(selectedLine.code)

    const getStationName = (code) => code ? stationCodeToData[code]?.[stationLabelLanguage] || code : '—'

    const isLRT = isLrtLine(selectedLine.code)

    const getTerminals = () => {
        if (!sequence.length || isLRT) return []
        const terminals = []
        const first = sequence[0]
        const last = sequence[sequence.length - 1]
        const branchTerminals = []
        if (first) terminals.push(first)
        if (selectedLine.code === 'CC' && sequence.includes('CE2')) branchTerminals.push('CE2')
        if (selectedLine.code === 'EW' && sequence.includes('CG2')) branchTerminals.push('CG2')
        if (last && last !== first) terminals.push(last)
        return [...terminals, ...branchTerminals]
    }

    const terminalCodes = getTerminals()
    const orderedCodes = terminalCodes.length > 2
        ? [terminalCodes[1], terminalCodes[2], terminalCodes[0]]
        : terminalCodes

    const terminalColor = selectedLine.color

    return (
        <PanelShell isClosing={isLineClosing} isEntering={isEntering}>
            <div style={{ height: '10px', background: terminalColor }} />
            <PanelCloseButton onClick={onClose} variant="glass" ariaLabel="Close line panel" />

            <div style={{ padding: '24px' }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{selectedLine.code}</div>
                <div style={{
                    marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '10px',
                    padding: '10px 16px', borderRadius: '999px', background: terminalColor,
                    fontWeight: 'bold', fontSize: '17px', color: 'white',
                    boxShadow: `0 0 20px ${terminalColor}55`
                }}>
                    {selectedLine.name}
                </div>

                <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <StatBox label={panelLabel('stations')} value={sequence.length} t={t} labelOpacity={labelOpacity} />
                        {length && <StatBox label={panelLabel('length')} value={`${typeof length === 'number' ? length.toFixed(1) : length} km`} t={t} labelOpacity={labelOpacity} />}
                        <StatBox label={panelLabel('network')} value={selectedLine.network || '—'} t={t} labelOpacity={labelOpacity} />
                    </div>

                    {story && (
                        <LineStoryCard
                            story={story}
                            color={terminalColor}
                            language={stationLabelLanguage}
                            labelOpacity={labelOpacity}
                            t={t}
                        />
                    )}

                    {orderedCodes.length > 0 && (
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', ...animated(labelOpacity * 0.7) }}>
                                {panelLabel('terminal')}
                            </div>
                            <div style={{
                                background: t.overlayLight, padding: '18px 16px 14px 16px', borderRadius: '10px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                    {orderedCodes.map((code, idx) => (
                                        <div key={code} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <div onClick={() => { onClose(); setTimeout(() => onNavigateToStation(code), 100) }}
                                                style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                                    cursor: 'pointer', flexShrink: 0, width: '80px'
                                                }}
                                            >
                                                <div style={{
                                                    fontSize: '13px', fontWeight: '500', opacity: 0.85, textAlign: 'center',
                                                    marginBottom: '8px', lineHeight: '16px', minHeight: '18px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%',
                                                    whiteSpace: 'normal', overflowWrap: 'break-word', wordBreak: 'normal',
                                                    opacity: labelOpacity,
                                                    transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s cubic-bezier(0.22,1,0.36,1)',
                                                    transform: labelOpacity === 0 ? 'translateY(8px) scale(0.92)' : 'translateY(0px) scale(1)',
                                                    filter: labelOpacity === 0 ? 'blur(6px)' : 'blur(0px)'
                                                }}>
                                                    {getStationName(code)}
                                                </div>
                                                <div
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1.12)'
                                                        e.currentTarget.style.boxShadow = `0 0 12px ${terminalColor}`
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'scale(1)'
                                                        e.currentTarget.style.boxShadow = `0 0 8px ${terminalColor}33`
                                                    }}
                                                    style={{
                                                        width: '46px', height: '28px', borderRadius: '999px',
                                                        background: 'transparent', border: `2px solid ${terminalColor}`,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 'bold', fontSize: '11px', color: terminalColor,
                                                        boxShadow: `0 0 8px ${terminalColor}33`,
                                                        transition: 'transform 0.25s, box-shadow 0.25s'
                                                    }}
                                                >{code}</div>
                                            </div>
                                            {idx === 0 && orderedCodes.length > 1 && (
                                                <div style={{
                                                    width: '40px', height: '4px', background: terminalColor,
                                                    borderRadius: '999px', opacity: 0.8, flexShrink: 0, marginBottom: '12px'
                                                }} />
                                            )}
                                            {idx === 1 && orderedCodes.length > 2 && (
                                                <span style={{
                                                    color: terminalColor, fontSize: '18px', fontWeight: 'bold',
                                                    opacity: 0.7, margin: '0 8px', flexShrink: 0, marginBottom: '6px'
                                                }}>/</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </PanelShell>
    )
}

function LineStoryCard({ story, color, language, labelOpacity, t }) {
    const title = story.title[language] || story.title.en
    const summary = story.summary[language] || story.summary.en
    const tags = story.tags[language] || story.tags.en || []

    return (
        <div style={{
            background: t.overlayLight,
            border: `1px solid ${t.borderMedium}`,
            borderRadius: '12px',
            padding: '16px',
            boxShadow: `inset 4px 0 0 ${color}`
        }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                marginBottom: '8px'
            }}>
                <span style={{
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    background: color,
                    boxShadow: `0 0 10px ${color}88`,
                    flexShrink: 0
                }} />
                <div style={{
                    fontSize: '15px',
                    fontWeight: 'bold',
                    color: t.textPrimary,
                    lineHeight: 1.25,
                    ...languageTextStyle(labelOpacity)
                }}>
                    {title}
                </div>
            </div>
            <div style={{
                fontSize: '13px',
                lineHeight: 1.45,
                color: t.textSecondary,
                ...languageTextStyle(labelOpacity, labelOpacity * 0.72)
            }}>
                {summary}
            </div>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '7px',
                marginTop: '12px'
            }}>
                {tags.map(tag => (
                    <span key={tag} style={{
                        padding: '5px 9px',
                        borderRadius: '999px',
                        background: t.overlayMedium,
                        border: `1px solid ${color}33`,
                        color: t.textPrimary,
                        fontSize: '11px',
                        fontWeight: 700,
                        lineHeight: 1,
                        ...languageTextStyle(labelOpacity, labelOpacity * 0.86)
                    }}>
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    )
}

function StatBox({ label, value, t, labelOpacity }) {
    const animated = languageTextStyle(labelOpacity, labelOpacity * 0.5)
    return (
        <div style={{
            background: t.overlayMedium, padding: '10px 16px',
            borderRadius: '10px', fontSize: '14px', display: 'flex', gap: '8px'
        }}>
            <span style={animated}>{label}</span>
            <span style={{ fontWeight: 'bold' }}>{value}</span>
        </div>
    )
}
