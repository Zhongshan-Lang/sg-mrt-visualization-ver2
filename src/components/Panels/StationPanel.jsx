import { useState, useEffect } from 'react'
import maplibregl from 'maplibre-gl'
import { stationLineToActualCode, lineColors } from '../../config'
import { stationCodeToData } from '../../data/generated/stationIndex'
import { stationEntrancesByCodes } from '../../data/generated/stationEntrances'
import { linePropertiesByCode, generatedLineSequences } from '../../data/generated/lineIndex'
import { flyToLine, getStationConnections } from '../../utils/stationUtils'
import { useTheme } from '../../contexts/ThemeContext'
import { getPanelLabel, stationPanelLabels } from '../../i18n/panelLabels'
import { languageTextStyle } from '../../utils/languageAnimation'
import { defaultStationFacilities, localServiceLabel, stationFacilityLabels } from '../../data/serviceInfo'
import { focusEntranceCamera, focusStationCamera } from '../../camera/stationCamera'
import PanelCloseButton from '../UI/PanelCloseButton'
import PanelShell from '../UI/PanelShell'

export default function StationPanel({
    selectedStation, isClosing, isEntering, bookmarks,
    onClose, onToggleBookmark, onNavigateToStation,
    mapRef, setSelectedLine, setSelectedLines, setIsEntering,
    stationLabelLanguage, labelOpacity,
    images = [],
    currentImage, onImageChange, isImageHovered, onImageHoverChange,
    activeEntranceMarkerRef,
    getArrivals
}) {
    const { t } = useTheme()
    const [isButtonHovered, setIsButtonHovered] = useState(false)
    const [arrivals, setArrivals] = useState([])
    const [wikipediaUrl, setWikipediaUrl] = useState('#')
    const [exitLandmarksByExit, setExitLandmarksByExit] = useState({})
    const panelLabel = (key) => getPanelLabel(stationPanelLabels, key, stationLabelLanguage)
    const animated = (opacity = labelOpacity) => languageTextStyle(labelOpacity, opacity)

    // 每 3 秒轮询列车到站信息（必须在 early return 之前）
    useEffect(() => {
        if (!selectedStation || !getArrivals) return
        const codes = (selectedStation.station_codes || '').split('-')
        const poll = () => {
            try {
                const all = []
                codes.forEach(c => { all.push(...getArrivals(c)) })
                setArrivals(all)
            } catch (_) {}
        }
        poll()
        const timer = setInterval(poll, 3000)
        return () => clearInterval(timer)
    }, [selectedStation, getArrivals])

    useEffect(() => {
        if (!selectedStation) return
        let cancelled = false
        import('../../data/loaders/wikipediaData').then(({ getWikipediaUrl }) => {
            if (!cancelled) setWikipediaUrl(getWikipediaUrl(selectedStation.name))
        })
        return () => { cancelled = true }
    }, [selectedStation?.name])

    useEffect(() => {
        if (!selectedStation) {
            setExitLandmarksByExit({})
            return
        }
        let cancelled = false
        import('../../data/loaders/exitLandmarkData').then(({ getExitLandmarksForStation }) => {
            if (!cancelled) setExitLandmarksByExit(getExitLandmarksForStation(selectedStation.station_codes))
        })
        return () => { cancelled = true }
    }, [selectedStation?.station_codes])

    if (!selectedStation) return null
    const displayImages = images.length > 0
        ? images
        : ['https://placehold.co/600x400/111111/FFFFFF?text=Station']

    const stationConnections = getStationConnections(selectedStation.station_codes || '', generatedLineSequences)

    const stationEntrances = (() => {
        const targetCodes = selectedStation.station_codes || ''
        const exits = [...(stationEntrancesByCodes[targetCodes] || [])]
        // Natural sort: numbers before letters, numeric ordering for digits
        exits.sort((a, b) => {
            const na = a.name, nb = b.name
            const ia = parseInt(na), ib = parseInt(nb)
            if (!isNaN(ia) && !isNaN(ib)) return ia - ib
            if (!isNaN(ia)) return -1
            if (!isNaN(ib)) return 1
            return na.localeCompare(nb)
        })
        return exits
    })()

    // Look up landmarks for a station+exit combination
    const getExitLandmarks = (exitName) => {
        return exitLandmarksByExit[exitName] || []
    }

    return (
        <PanelShell
            className="station-panel"
            side="right"
            width="430px"
            maxHeight="calc(100vh - 40px)"
            isClosing={isClosing}
            isEntering={isEntering}
            animation="station"
            scroll
        >
            <PanelCloseButton onClick={onClose} ariaLabel="Close station panel" />

            {/* 图片区域 */}
            <div onMouseEnter={() => onImageHoverChange?.(true)}
                onMouseLeave={() => onImageHoverChange?.(false)}
                style={{ position: 'relative' }}
            >
                <div style={{ width: '100%', height: '220px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                        position: 'absolute', bottom: 12, left: 0, right: 0,
                        display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 5
                    }}>
                        {displayImages.map((_, index) => (
                            <div key={index} onClick={() => onImageChange?.(index)} style={{
                                width: currentImage === index ? '22px' : '8px',
                                height: '8px', borderRadius: '999px',
                                background: currentImage === index ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                transition: '0.35s', cursor: 'pointer'
                            }} />
                        ))}
                    </div>
                    <div style={{
                        display: 'flex', width: `${displayImages.length * 100}%`,
                        transform: `translateX(-${currentImage * (100 / displayImages.length)}%)`,
                        transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)'
                    }}>
                        {displayImages.map((image, index) => (
                            <img key={index} src={image} style={{
                                width: `${100 / displayImages.length}%`,
                                height: '220px', objectFit: 'cover', flexShrink: 0
                            }} />
                        ))}
                    </div>
                </div>
                <div style={{
                    position: 'absolute', top: '90px', left: 0, right: 0,
                    display: 'flex', justifyContent: 'space-between', padding: '0 12px',
                    opacity: isImageHovered ? 1 : 0, transition: 'opacity 0.25s'
                }}>
                    <button onMouseEnter={() => setIsButtonHovered(true)}
                        onMouseLeave={() => setIsButtonHovered(false)}
                        onClick={() => {
                            if (images.length <= 1) return
                            onImageChange?.(currentImage === 0 ? images.length - 1 : currentImage - 1)
                        }}
                        style={{
                            width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                            background: isButtonHovered ? t.closeBtnBgHover : t.closeBtnBg,
                            backdropFilter: isButtonHovered ? 'blur(12px)' : 'none',
                            color: 'white', cursor: 'pointer', fontSize: '22px', transition: '0.25s'
                        }}
                    >❮</button>
                    <button onMouseEnter={() => setIsButtonHovered(true)}
                        onMouseLeave={() => setIsButtonHovered(false)}
                        onClick={() => {
                            if (images.length <= 1) return
                            onImageChange?.(currentImage === images.length - 1 ? 0 : currentImage + 1)
                        }}
                        style={{
                            width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                            background: isButtonHovered ? t.closeBtnBgHover : t.closeBtnBg,
                            backdropFilter: isButtonHovered ? 'blur(12px)' : 'none',
                            color: 'white', cursor: 'pointer', fontSize: '22px', transition: '0.25s'
                        }}
                    >❯</button>
                </div>
            </div>

            {/* 文字内容 */}
            <div style={{ padding: '22px', minHeight: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '30px', fontWeight: 'bold' }}>{selectedStation.name}</div>
                    <button onClick={() => onToggleBookmark(selectedStation.station_codes)}
                        style={{
                            width: '32px', height: '32px', border: 'none', borderRadius: '50%',
                            background: 'transparent',
                            color: bookmarks.includes(selectedStation.station_codes) ? t.bookmarkActive : t.bookmarkInactive,
                            cursor: 'pointer', fontSize: '22px', transition: '0.2s', marginRight: '8px'
                        }}
                        title={bookmarks.includes(selectedStation.station_codes) ? 'cancel · 取消收藏' : 'bookmark · 收藏站点'}
                    >{bookmarks.includes(selectedStation.station_codes) ? '★' : '☆'}</button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '20px', opacity: 0.85 }}>{selectedStation.name_zh}</div>
                <div style={{ marginTop: '6px', fontSize: '14px', opacity: 0.6 }}>{selectedStation.name_ta}</div>

                {/* 线路标签 */}
                <div style={{ marginTop: '22px', fontSize: '18px', fontWeight: 'bold' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '22px' }}>
                        {(selectedStation.station_codes || '').split('-').map((line, index) => {
                            const prefix = line.match(/[A-Z]+/)?.[0]
                            const actualCode = stationLineToActualCode[prefix] || prefix
                            return (
                                <div key={index} onClick={() => {
                                    onClose()
                                    const lineProperties = linePropertiesByCode[actualCode]
                                    if (lineProperties && mapRef.current) {
                                        flyToLine(actualCode, mapRef, setSelectedLine, setSelectedLines, setIsEntering)
                                    }
                                }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'scale(1.08)'
                                        e.currentTarget.style.boxShadow = `0 0 16px ${lineColors[actualCode] || '#444'}`
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'scale(1)'
                                        e.currentTarget.style.boxShadow = t.shadowBadge
                                    }}
                                    style={{
                                        background: lineColors[actualCode] || '#444',
                                        padding: '8px 14px', borderRadius: '999px',
                                        fontSize: '14px', fontWeight: 'bold', color: 'white',
                                        boxShadow: t.shadowBadge,
                                        cursor: 'pointer', transition: 'transform 0.25s, box-shadow 0.25s'
                                    }}
                                >{line}</div>
                            )
                        })}
                    </div>
                </div>

                {/* Route section */}
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
                                                        <span ref={(el) => {
                                                            if (!el) return
                                                            if (stationLabelLanguage === 'ta' && el.scrollWidth > 100) {
                                                                const duration = Math.max(2.5, 5 - (el.scrollWidth - 100) / 15)
                                                                el.style.animation = `scrollText ${duration}s linear infinite`
                                                                el.parentElement.style.justifyContent = 'flex-start'
                                                            } else {
                                                                el.style.animation = 'none'
                                                                if (stationLabelLanguage !== 'ta') el.parentElement.style.justifyContent = 'center'
                                                            }
                                                        }} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                                                            {stationCodeToData[station]?.[stationLabelLanguage]}
                                                        </span>
                                                    </div>
                                                    <div onClick={() => { if (!isCurrent) onNavigateToStation(station) }}
                                                        onMouseEnter={(e) => {
                                                            if (!isCurrent) {
                                                                e.currentTarget.style.transform = 'scale(1.12)'
                                                                e.currentTarget.style.boxShadow = `0 0 14px ${color}`
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!isCurrent) {
                                                                e.currentTarget.style.transform = 'scale(1)'
                                                                e.currentTarget.style.boxShadow = 'none'
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

                {/* 出口信息 */}
                {/* 到站预报 */}
                {arrivals.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', ...animated(labelOpacity * 0.8) }}>
                            {panelLabel('nextTrains')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {(() => {
                                const groups = {}
                                arrivals.forEach(a => {
                                    const k = a.terminal
                                    if (!groups[k]) groups[k] = { ...a, trains: [] }
                                    groups[k].trains.push(a)
                                })
                                return Object.values(groups).map((g, i) => {
                                    const termName = stationCodeToData[g.terminal]?.[stationLabelLanguage] || stationCodeToData[g.terminal]?.en || g.terminal
                                    return (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            background: t.overlayMedium, padding: '8px 12px', borderRadius: '8px'
                                        }}>
                                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: lineColors[g.line] || g.lineColor, flexShrink: 0 }} />
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: lineColors[g.line] || g.lineColor }}>{g.line}</span>
                                            <span style={{
                                                fontSize: '11px', opacity: labelOpacity * 0.5,
                                                transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s cubic-bezier(0.22,1,0.36,1)',
                                                transform: labelOpacity === 0 ? 'translateY(4px) scale(0.95)' : 'translateY(0px) scale(1)',
                                                filter: labelOpacity === 0 ? 'blur(4px)' : 'blur(0px)'
                                            }}>{panelLabel('to')}&nbsp;&nbsp;{termName}</span>
                                            <span style={{ marginLeft: 'auto', fontSize: '12px', opacity: 0.7 }}>
                                                {g.trains.map((t, j) => (
                                                    <span key={j}>{j > 0 ? ' · ' : ''}{t.etaMin} min</span>
                                                ))}
                                            </span>
                                        </div>
                                    )
                                })
                            })()}
                        </div>
                    </div>
                )}

                <StationFacilitiesSection
                    facilities={defaultStationFacilities}
                    language={stationLabelLanguage}
                    labelOpacity={labelOpacity}
                    t={t}
                />

                {stationEntrances.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', ...animated(labelOpacity * 0.8) }}>
                            {panelLabel('exits')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {stationEntrances.map((entrance, idx) => {
                                const exitName = entrance.name
                                const landmarks = getExitLandmarks(exitName)
                                return (
                                    <div key={idx} onClick={() => {
                                        if (!mapRef.current) return
                                        if (activeEntranceMarkerRef?.current) {
                                            const currentMarkerPos = activeEntranceMarkerRef.current.getLngLat()
                                            const clickedPos = entrance.coordinates
                                            if (currentMarkerPos.lng === clickedPos[0] && currentMarkerPos.lat === clickedPos[1]) {
                                                focusStationCamera(
                                                    mapRef.current,
                                                    selectedStation.geometry?.coordinates || [103.851959, 1.290270],
                                                    { duration: 800 }
                                                )
                                                activeEntranceMarkerRef.current.remove()
                                                activeEntranceMarkerRef.current = null
                                                return
                                            }
                                            activeEntranceMarkerRef.current.remove()
                                        }
                                        focusEntranceCamera(mapRef.current, entrance.coordinates)
                                        const marker = new maplibregl.Marker({
                                            color: t.entranceMarker, opacity: '0.9', scale: 1.2
                                        }).setLngLat(entrance.coordinates).addTo(mapRef.current)
                                        if (activeEntranceMarkerRef) activeEntranceMarkerRef.current = marker
                                    }}
                                        style={{
                                            background: t.overlayStrong, padding: '10px 12px',
                                            borderRadius: '10px', cursor: 'pointer', transition: '0.2s'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = t.overlayHover }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = t.overlayStrong }}
                                    >
                                        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                                            <span style={{
                                                background: t.entranceMarker, color: '#000',
                                                padding: '3px 10px', borderRadius: '6px',
                                                fontSize: '13px', fontWeight: 'bold',
                                                whiteSpace: 'nowrap', flexShrink: 0,
                                                ...animated()
                                            }}>{panelLabel('exit')} {exitName}</span>
                                            {landmarks.length > 0 ? (
                                                landmarks.slice(0, 6).map((lm, i) => (
                                                    <span key={i} style={{
                                                        fontSize: '11px', color: t.textSecondary,
                                                        background: t.overlayMedium,
                                                        padding: '2px 6px', borderRadius: '4px',
                                                        whiteSpace: 'nowrap'
                                                    }}>{lm.name}</span>
                                                ))
                                            ) : (
                                                <span style={{
                                                    fontSize: '11px', color: t.textSecondary,
                                                    fontStyle: 'italic',
                                                    ...animated()
                                                }}>{panelLabel('missingExitInfo')}</span>
                                            )}
                                            {landmarks.length > 6 && (
                                                <span style={{ fontSize: '11px', color: t.textSecondary, ...animated() }}>
                                                    +{landmarks.length - 6} {panelLabel('more')}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Wikipedia */}
                <a href={wikipediaUrl}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                        display: 'inline-block', marginTop: '26px',
                        color: t.textPrimary, textDecoration: 'none',
                        padding: '12px 18px', borderRadius: '14px',
                        background: t.overlayMedium,
                        border: `1px solid ${t.borderMedium}`,
                        backdropFilter: 'blur(12px)', fontWeight: 600, transition: '0.25s'
                    }}
                >View Wikipedia</a>
            </div>
        </PanelShell>
    )
}

function StationFacilitiesSection({ facilities, language, labelOpacity, t }) {
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
                        <div key={item.key} style={{
                            gridColumn: item.wide ? '1 / -1' : 'auto',
                            background: t.overlayMedium,
                            border: `1px solid ${isAvailable ? t.borderMedium : t.borderLight}`,
                            borderRadius: '10px',
                            padding: item.wide ? '10px 12px' : '9px 10px',
                            minWidth: 0
                        }}>
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
