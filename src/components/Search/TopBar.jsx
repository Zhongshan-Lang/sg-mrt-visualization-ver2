import { useRef, useState } from 'react'
import mrtData from '../../data/sg-rail.geo.json'
import { stationLineToActualCode, lineColors } from '../../config'
import { stationCodeToData } from '../../data/generated/stationIndex'
import { searchStations } from '../../utils/stationUtils'
import { useTheme } from '../../contexts/ThemeContext'

export default function TopBar({
    searchQuery, setSearchQuery,
    bookmarks,
    showBookmarks, setShowBookmarks,
    showNavigation, setShowNavigation,
    isBookmarksClosing, setIsBookmarksClosing,
    isNavClosing, setIsNavClosing,
    isSearchClosing, setIsSearchClosing,
    navStart, setNavStart,
    navEnd, setNavEnd,
    navStartQuery, setNavStartQuery,
    navEndQuery, setNavEndQuery,
    showRoutePanel,
    onSwapNavStations,
    onNavigateToStation,
    onCalculateRoute,
    onClearNavigation,
    stationLabelLanguage,
    onCycleLanguage,
    isLanguageLocked,
    onToggleLanguageLock,
    onOpenGuide
}) {
    const { t } = useTheme()
    const [searchResults, setSearchResults] = useState([])
    const [navStartResults, setNavStartResults] = useState([])
    const [navEndResults, setNavEndResults] = useState([])

    const handleSearch = (value) => {
        setSearchQuery(value)
        setSearchResults(value.trim() ? searchStations(value) : [])
    }

    const handleNavSearch = (value, type) => {
        if (type === 'start') {
            setNavStartQuery(value)
            setNavStartResults(value.trim() ? searchStations(value, 6) : [])
            return
        }
        setNavEndQuery(value)
        setNavEndResults(value.trim() ? searchStations(value, 6) : [])
    }

    const selectNavStation = (code, type) => {
        if (type === 'start') {
            setNavStart(code)
            setNavStartQuery('')
            setNavStartResults([])
            return
        }
        setNavEnd(code)
        setNavEndQuery('')
        setNavEndResults([])
    }

    const closeNavigation = () => {
        if (showNavigation) {
            setIsNavClosing(true)
            setTimeout(() => {
                setShowNavigation(false)
                setIsNavClosing(false)
                if (!showRoutePanel) onClearNavigation()
            }, 200)
            return
        }
        setShowNavigation(true)
        setShowBookmarks(false)
    }

    return (
        <div style={{
            position: 'absolute', top: 20, left: '50%',
            transform: 'translateX(-50%)', zIndex: 20, width: 'min(430px, calc(100vw - 32px))'
        }}>
            <div style={{
                display: 'flex', alignItems: 'center',
                background: t.searchBg, backdropFilter: 'blur(20px)',
                borderRadius: '16px', padding: '8px 16px',
                border: `1px solid ${t.borderStrong}`,
                boxSizing: 'border-box',
                width: '100%'
            }}>
                <span
                    onClick={() => {
                        if (showBookmarks) {
                            setIsBookmarksClosing(true)
                            setTimeout(() => { setShowBookmarks(false); setIsBookmarksClosing(false) }, 200)
                        } else {
                            setShowBookmarks(true)
                            setShowNavigation(false)
                        }
                    }}
                    style={{ cursor: 'pointer', opacity: showBookmarks ? t.iconOpacityActive : t.iconOpacity, fontSize: '16px', marginRight: '8px' }}
                    title="Bookmarks · 收藏"
                >⭐</span>
                <span
                    onClick={closeNavigation}
                    style={{ cursor: 'pointer', opacity: showNavigation ? t.iconOpacityActive : t.iconOpacity, fontSize: '16px', marginRight: '8px' }}
                    title="Route planner · 路线规划"
                >🧭</span>
                <span style={{ opacity: searchQuery ? 1 : t.searchIconOpacity, marginRight: '10px', fontSize: '16px' }}>🔍</span>
                <input
                    type="text"
                    placeholder="Search station / 搜索站点..."
                    value={searchQuery}
                    onChange={(event) => {
                        const value = event.target.value
                        if (value === '' && searchResults.length > 0) {
                            setIsSearchClosing(true)
                            setTimeout(() => { handleSearch(''); setIsSearchClosing(false) }, 200)
                        } else {
                            handleSearch(value)
                        }
                    }}
                    style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        color: t.textPrimary, fontSize: '14px', fontFamily: 'sans-serif',
                        minWidth: 0
                    }}
                />
                <LanguageButton
                    language={stationLabelLanguage}
                    onClick={onCycleLanguage}
                    isLocked={isLanguageLocked}
                    onToggleLock={onToggleLanguageLock}
                    t={t}
                />
                <button
                    type="button"
                    onClick={onOpenGuide}
                    title="Guide · 使用教程"
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '999px',
                        border: `1px solid ${t.borderMedium}`,
                        background: t.overlayMedium,
                        color: t.textPrimary,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 800,
                        lineHeight: 1,
                        marginLeft: '8px',
                        marginRight: searchQuery ? '8px' : 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background 0.2s, transform 0.2s, border-color 0.2s'
                    }}
                    onMouseEnter={(event) => {
                        event.currentTarget.style.background = t.overlayStrong
                        event.currentTarget.style.borderColor = t.highlightAccent
                        event.currentTarget.style.transform = 'scale(1.06)'
                    }}
                    onMouseLeave={(event) => {
                        event.currentTarget.style.background = t.overlayMedium
                        event.currentTarget.style.borderColor = t.borderMedium
                        event.currentTarget.style.transform = 'scale(1)'
                    }}
                >
                    ?
                </button>
                {searchQuery && (
                    <span
                        onClick={() => {
                            setIsSearchClosing(true)
                            setTimeout(() => { setSearchQuery(''); setSearchResults([]); setIsSearchClosing(false) }, 200)
                        }}
                        style={{ cursor: 'pointer', opacity: 0.5, fontSize: '16px', color: t.textPrimary }}
                    >×</span>
                )}
            </div>

            {searchResults.length > 0 && (
                <ResultList
                    results={searchResults}
                    bookmarks={bookmarks}
                    t={t}
                    isClosing={isSearchClosing}
                    onSelect={(feature) => {
                        const code = (feature.properties.station_codes || '').split('-')[0]
                        onNavigateToStation(code)
                        setSearchQuery('')
                        setSearchResults([])
                    }}
                />
            )}

            {showNavigation && (
                <div style={{
                    marginTop: '8px', background: t.panelBg, backdropFilter: 'blur(20px)',
                    borderRadius: '16px', padding: '16px', border: `1px solid ${t.borderMedium}`,
                    color: t.textPrimary, fontFamily: 'sans-serif',
                    animation: isNavClosing
                        ? 'panelFadeOut 0.2s cubic-bezier(0.22,1,0.36,1) forwards'
                        : 'panelFadeIn 0.25s cubic-bezier(0.22,1,0.36,1)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            Route Planner · 路线规划
                        </div>
                        <button
                            type="button"
                            onClick={onSwapNavStations}
                            title="Swap start and destination · 切换起点终点"
                            style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '999px',
                                border: `1px solid ${t.borderMedium}`,
                                background: t.overlayMedium,
                                color: t.textPrimary,
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 700,
                                lineHeight: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s, transform 0.2s',
                                flexShrink: 0
                            }}
                            onMouseEnter={(event) => {
                                event.currentTarget.style.background = t.overlayStrong
                                event.currentTarget.style.transform = 'scale(1.06)'
                            }}
                            onMouseLeave={(event) => {
                                event.currentTarget.style.background = t.overlayMedium
                                event.currentTarget.style.transform = 'scale(1)'
                            }}
                        >
                            ⇅
                        </button>
                    </div>

                    <NavStationField
                        label="From · 起点"
                        value={navStart}
                        query={navStartQuery}
                        results={navStartResults}
                        onClear={() => setNavStart(null)}
                        onQuery={(value) => handleNavSearch(value, 'start')}
                        onSelect={(code) => selectNavStation(code, 'start')}
                        t={t}
                    />

                    <NavStationField
                        label="To · 终点"
                        value={navEnd}
                        query={navEndQuery}
                        results={navEndResults}
                        onClear={() => setNavEnd(null)}
                        onQuery={(value) => handleNavSearch(value, 'end')}
                        onSelect={(code) => selectNavStation(code, 'end')}
                        t={t}
                    />

                    <button
                        onClick={onCalculateRoute}
                        disabled={!navStart || !navEnd}
                        style={{
                            width: '100%', padding: '10px',
                            background: navStart && navEnd ? t.routeBtn : t.routeBtnDisabledBg,
                            border: 'none', borderRadius: '10px', color: navStart && navEnd ? 'white' : t.textSecondary,
                            fontSize: '14px', fontWeight: 'bold',
                            cursor: navStart && navEnd ? 'pointer' : 'default',
                            marginBottom: '12px'
                        }}
                    >Find Route · 查询路线</button>
                </div>
            )}

            {searchQuery && searchResults.length === 0 && (
                <div style={{
                    marginTop: '8px', background: t.panelBg, backdropFilter: 'blur(20px)',
                    borderRadius: '16px', padding: '16px', textAlign: 'center',
                    fontSize: '13px', color: t.textMuted, border: `1px solid ${t.borderMedium}`,
                    animation: isSearchClosing
                        ? 'panelFadeOut 0.2s cubic-bezier(0.22,1,0.36,1) forwards'
                        : 'panelFadeIn 0.25s cubic-bezier(0.22,1,0.36,1)'
                }}>
                    No results found · 未找到相关站点
                </div>
            )}

            {showBookmarks && (
                <div className="nav-scroll" style={{
                    marginTop: '8px', background: t.panelBg, backdropFilter: 'blur(20px)',
                    borderRadius: '16px', overflow: 'hidden', border: `1px solid ${t.borderMedium}`,
                    maxHeight: '320px', overflowY: 'auto',
                    animation: isBookmarksClosing
                        ? 'panelFadeOut 0.2s cubic-bezier(0.22,1,0.36,1) forwards'
                        : 'panelFadeIn 0.25s cubic-bezier(0.22,1,0.36,1)'
                }}>
                    {bookmarks.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', opacity: 0.5, fontSize: '13px', color: t.textPrimary }}>
                            No bookmarks · 暂无收藏
                        </div>
                    ) : (
                        bookmarks.map((code, index) => {
                            const feature = mrtData.features.find(f =>
                                f.geometry.type === 'Point' &&
                                f.properties.stop_type !== 'entrance' &&
                                f.properties.type !== 'subway' &&
                                (f.properties.station_codes || '').split('-').includes(code)
                            )
                            if (!feature) return null
                            return (
                                <StationResultRow
                                    key={index}
                                    feature={feature}
                                    bookmarked
                                    t={t}
                                    onClick={() => {
                                        onNavigateToStation(code.split('-')[0])
                                        setShowBookmarks(false)
                                    }}
                                />
                            )
                        })
                    )}
                </div>
            )}
        </div>
    )
}

function NavStationField({ label, value, query, results, onClear, onQuery, onSelect, t }) {
    return (
        <div style={{ marginBottom: '10px', position: 'relative' }}>
            <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {value ? (
                    <div style={{
                        flex: 1, padding: '8px 12px', background: t.overlayStrong,
                        borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '13px' }}>{stationCodeToData[value]?.en || value}</span>
                        <span onClick={onClear} style={{ cursor: 'pointer', opacity: 0.5 }}>×</span>
                    </div>
                ) : (
                    <input
                        type="text"
                        placeholder="Station name..."
                        value={query}
                        onChange={(event) => onQuery(event.target.value)}
                        style={{
                            flex: 1, padding: '8px 12px', background: t.overlayMedium,
                            border: `1px solid ${t.borderStrong}`,
                            borderRadius: '8px',
                            color: t.textPrimary, fontSize: '13px', outline: 'none'
                        }}
                    />
                )}
            </div>
            {results.length > 0 && (
                <div className="nav-scroll" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    background: t.navDropdownBg, borderRadius: '8px',
                    border: `1px solid ${t.borderStrong}`,
                    maxHeight: '160px', overflowY: 'auto', zIndex: 25
                }}>
                    {results.map((feature, index) => (
                        <div
                            key={index}
                            onClick={() => onSelect((feature.properties.station_codes || '').split('-')[0])}
                            style={{
                                padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
                                borderBottom: `1px solid ${t.borderLight}`,
                                color: t.textPrimary
                            }}
                            onMouseEnter={(event) => event.currentTarget.style.background = t.overlayMedium}
                            onMouseLeave={(event) => event.currentTarget.style.background = 'transparent'}
                        >
                            {feature.properties.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

function ResultList({ results, bookmarks, t, isClosing, onSelect }) {
    return (
        <div className="nav-scroll" style={{
            marginTop: '8px', background: t.panelBg, backdropFilter: 'blur(20px)',
            borderRadius: '16px', overflow: 'hidden', border: `1px solid ${t.borderMedium}`,
            maxHeight: '320px', overflowY: 'auto',
            animation: isClosing
                ? 'panelFadeOut 0.2s cubic-bezier(0.22,1,0.36,1) forwards'
                : 'panelFadeIn 0.25s cubic-bezier(0.22,1,0.36,1)'
        }}>
            {results.map((feature, index) => (
                <StationResultRow
                    key={index}
                    feature={feature}
                    bookmarked={bookmarks.some(b => (feature.properties.station_codes || '').split('-').includes(b))}
                    t={t}
                    onClick={() => onSelect(feature)}
                />
            ))}
        </div>
    )
}

function StationResultRow({ feature, bookmarked, t, onClick }) {
    return (
        <div
            onClick={onClick}
            style={{
                padding: '12px 16px', cursor: 'pointer',
                borderBottom: `1px solid ${t.borderLight}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                color: t.textPrimary
            }}
            onMouseEnter={(event) => event.currentTarget.style.background = t.overlayMedium}
            onMouseLeave={(event) => event.currentTarget.style.background = 'transparent'}
        >
            <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>
                    {bookmarked ? '⭐ ' : ''}{feature.properties.name}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '2px' }}>{feature.properties.name_zh}</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
                {(feature.properties.station_codes || '').split('-').map((code, index) => {
                    const prefix = code.match(/[A-Z]+/)?.[0]
                    const actualCode = stationLineToActualCode[prefix] || prefix
                    return (
                        <span key={index} style={{
                            background: lineColors[actualCode] || '#808080',
                            padding: '2px 8px', borderRadius: '999px',
                            fontSize: '10px', fontWeight: 'bold', color: 'white'
                        }}>{code}</span>
                    )
                })}
            </div>
        </div>
    )
}

function languageButtonLabel(language) {
    if (language === 'zh') return '中'
    if (language === 'ta') return 'த'
    return 'EN'
}

function LanguageButton({ language, onClick, isLocked, onToggleLock, t }) {
    const [showLockControl, setShowLockControl] = useState(false)
    const hoverTimerRef = useRef(null)
    const hideTimerRef = useRef(null)

    const clearHoverTimer = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current)
            hoverTimerRef.current = null
        }
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current)
            hideTimerRef.current = null
        }
    }

    const handleMouseEnter = () => {
        clearHoverTimer()
        hoverTimerRef.current = setTimeout(() => setShowLockControl(true), 1000)
    }

    const handleMouseLeave = () => {
        if (hoverTimerRef.current) {
            clearTimeout(hoverTimerRef.current)
            hoverTimerRef.current = null
        }
        hideTimerRef.current = setTimeout(() => setShowLockControl(false), 450)
    }

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{ order: 10, position: 'relative', marginLeft: '8px', flexShrink: 0 }}
        >
            <button
                onClick={onClick}
                title={isLocked ? 'Language locked · 语言已锁定' : 'Switch language · 切换语言'}
                style={{
                    width: '30px',
                    height: '24px',
                    border: `1px solid ${isLocked ? t.highlightAccent : t.borderMedium}`,
                    borderRadius: '999px',
                    background: isLocked ? t.overlayStrong : t.overlayMedium,
                    color: t.textPrimary,
                    cursor: isLocked ? 'default' : 'pointer',
                    fontSize: language === 'ta' ? '10px' : '11px',
                    fontWeight: 800,
                    lineHeight: 1,
                    padding: 0,
                    animation: isLocked ? 'languageLockBreath 1.8s ease-in-out infinite' : 'none',
                    '--language-lock-glow-soft': t.highlightGlowSoft,
                    '--language-lock-glow-medium': t.highlightGlowMedium,
                    '--language-lock-glow-strong': t.highlightGlowStrong
                }}
            >
                {languageButtonLabel(language)}
            </button>
            {showLockControl && (
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation()
                        onToggleLock()
                    }}
                    style={{
                        position: 'absolute',
                        top: '27px',
                        right: 0,
                        zIndex: 30,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 10px',
                        borderRadius: '999px',
                        border: `1px solid ${t.borderMedium}`,
                        background: t.panelBg,
                        color: t.textPrimary,
                        boxShadow: t.shadowPopup,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontSize: '12px',
                        fontWeight: 700,
                        animation: 'panelFadeIn 0.2s cubic-bezier(0.22,1,0.36,1)'
                    }}
                    title={isLocked ? 'Unlock language switching · 解除语言锁定' : 'Lock current language · 锁定当前语言'}
                >
                    <span>{isLocked ? '🔓' : '🔒'}</span>
                    <span>{isLocked ? 'Unlock' : 'Lock'}</span>
                </button>
            )}
        </div>
    )
}

