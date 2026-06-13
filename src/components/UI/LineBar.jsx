import { useEffect, useRef, useState } from 'react'
import { flyToLine } from '../../utils/stationUtils'
import { useTheme } from '../../contexts/ThemeContext'

export default function LineBar({
    chromeVisible = true,
    allLines,
    mapRef,
    setSelectedStation,
    setIsClosing,
    setSelectedLine,
    setSelectedLines,
    setIsEntering,
    setHoveredLines,
    isSimulationRunning,
    simSpeed,
    onToggleSimulation,
    onCycleSpeed,
    showTrains,
    onToggleTrainVisibility
}) {
    const { t } = useTheme()
    const [showLineBar, setShowLineBar] = useState(false)
    const [simHovered, setSimHovered] = useState(false)
    const [speedHovered, setSpeedHovered] = useState(false)
    const [visHovered, setVisHovered] = useState(false)
    const [toggleHovered, setToggleHovered] = useState(false)
    const lineBarTimerRef = useRef(null)

    useEffect(() => {
        return () => clearTimeout(lineBarTimerRef.current)
    }, [])

    const handleToggle = () => {
        if (showLineBar) {
            clearTimeout(lineBarTimerRef.current)
            setShowLineBar(false)
            return
        }

        setShowLineBar(true)
        clearTimeout(lineBarTimerRef.current)
        lineBarTimerRef.current = setTimeout(() => setShowLineBar(false), 20000)
    }

    const zoomBtnBase = {
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        background: t.toolbarBg,
        backdropFilter: 'blur(16px)',
        border: `1px solid ${t.borderToolbar}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: t.textPrimary,
        fontSize: '16px',
        transition: '0.2s'
    }

    const simBtnBase = {
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: t.textPrimary,
        fontSize: '12px',
        fontWeight: 'bold',
        transition: '0.2s'
    }

    return (
        <div
            style={{
                position: 'absolute',
                left: 8,
                bottom: 20,
                zIndex: 15,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transform: chromeVisible ? 'translateX(0px)' : 'translateX(-18px)',
                opacity: chromeVisible ? 1 : 0,
                filter: chromeVisible ? 'blur(0px)' : 'blur(8px)',
                pointerEvents: chromeVisible ? 'auto' : 'none',
                visibility: chromeVisible ? 'visible' : 'hidden',
                transition: 'opacity 0.28s ease, transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), filter 0.28s ease, visibility 0.28s step-end',
                willChange: 'opacity, transform, filter'
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    left: '4px',
                    bottom: '48px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px'
                }}
            >
                <div
                    onClick={() => mapRef.current?.zoomIn({ duration: 300 })}
                    title="Zoom In · 放大"
                    style={zoomBtnBase}
                    onMouseEnter={(event) => {
                        event.currentTarget.style.background = t.sideChromeHoverBg
                        event.currentTarget.style.borderColor = t.sideChromeHoverBorder
                    }}
                    onMouseLeave={(event) => {
                        event.currentTarget.style.background = t.toolbarBg
                        event.currentTarget.style.borderColor = t.borderToolbar
                    }}
                >
                    +
                </div>

                <div
                    onClick={() => mapRef.current?.zoomOut({ duration: 300 })}
                    title="Zoom Out · 缩小"
                    style={zoomBtnBase}
                    onMouseEnter={(event) => {
                        event.currentTarget.style.background = t.sideChromeHoverBg
                        event.currentTarget.style.borderColor = t.sideChromeHoverBorder
                    }}
                    onMouseLeave={(event) => {
                        event.currentTarget.style.background = t.toolbarBg
                        event.currentTarget.style.borderColor = t.borderToolbar
                    }}
                >
                    −
                </div>

                <div style={{ height: '1px', margin: '2px 6px', background: t.borderToolbar }} />

                <div
                    onClick={onToggleSimulation}
                    data-testid="simulation-toggle"
                    title={isSimulationRunning ? 'Pause · 暂停' : 'Play · 播放'}
                    onMouseEnter={() => setSimHovered(true)}
                    onMouseLeave={() => setSimHovered(false)}
                    style={{
                        ...simBtnBase,
                        background: simHovered ? t.sideChromeHoverBg : t.toolbarBg,
                        border: `1px solid ${simHovered ? t.sideChromeHoverBorder : t.borderToolbar}`
                    }}
                >
                    {isSimulationRunning ? '⏸' : '▶'}
                </div>

                <div
                    onClick={onCycleSpeed}
                    title={`Speed ×${simSpeed} · 倍速`}
                    onMouseEnter={() => setSpeedHovered(true)}
                    onMouseLeave={() => setSpeedHovered(false)}
                    style={{
                        ...simBtnBase,
                        background: speedHovered ? t.sideChromeHoverBg : t.toolbarBg,
                        border: `1px solid ${speedHovered ? t.sideChromeHoverBorder : t.borderToolbar}`
                    }}
                >
                    ×{simSpeed}
                </div>

                <div
                    onClick={onToggleTrainVisibility}
                    data-testid="train-visibility-toggle"
                    title={showTrains ? 'Hide Trains · 隐藏列车' : 'Show Trains · 显示列车'}
                    onMouseEnter={() => setVisHovered(true)}
                    onMouseLeave={() => setVisHovered(false)}
                    style={{
                        ...simBtnBase,
                        background: !showTrains
                            ? (visHovered ? t.sideChromeActiveHoverBg : t.buildingActiveBg)
                            : (visHovered ? t.sideChromeHoverBg : t.toolbarBg),
                        border: !showTrains
                            ? `1px solid ${visHovered ? t.sideChromeHoverBorder : t.buildingActiveBorder}`
                            : `1px solid ${visHovered ? t.sideChromeHoverBorder : t.borderToolbar}`
                    }}
                >
                    {showTrains ? '👁' : '◉'}
                </div>
            </div>

            <div
                onClick={handleToggle}
                title={showLineBar ? 'Close · 收起' : 'Lines · 线路列表'}
                style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: toggleHovered ? t.sideChromeHoverBg : t.toolbarBg,
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${toggleHovered ? t.sideChromeHoverBorder : t.borderToolbar}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: t.textPrimary,
                    fontSize: '16px',
                    transition: '0.25s',
                    flexShrink: 0
                }}
                onMouseEnter={() => setToggleHovered(true)}
                onMouseLeave={() => setToggleHovered(false)}
            >
                {showLineBar ? '✕' : '☰'}
            </div>

            <div
                style={{
                    display: 'flex',
                    gap: '6px',
                    overflow: showLineBar ? 'visible' : 'hidden',
                    maxWidth: showLineBar ? '600px' : '0px',
                    opacity: showLineBar ? 1 : 0,
                    transition: 'max-width 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s'
                }}
            >
                {allLines.map((line, idx) => (
                    <div
                        key={idx}
                        onClick={() => {
                            setSelectedStation(null)
                            setIsClosing(false)
                            flyToLine(line.code, mapRef, setSelectedLine, setSelectedLines, setIsEntering, line.feature)
                        }}
                        style={{
                            background: line.color,
                            padding: '6px 14px',
                            borderRadius: '999px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            color: 'white',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            transition: '0.2s',
                            boxShadow: `0 0 8px ${line.color}44`
                        }}
                        onMouseEnter={(event) => {
                            setHoveredLines([line.code])
                            event.currentTarget.style.transform = 'scale(1.08)'
                            event.currentTarget.style.boxShadow = `0 0 14px ${line.color}66`
                        }}
                        onMouseLeave={(event) => {
                            const currentCode = line.code
                            setTimeout(() => {
                                setHoveredLines(prev => {
                                    if (prev.length === 1 && prev[0] === currentCode) return []
                                    return prev
                                })
                            }, 50)
                            event.currentTarget.style.transform = 'scale(1)'
                            event.currentTarget.style.boxShadow = `0 0 8px ${line.color}44`
                        }}
                    >
                        {line.code}
                    </div>
                ))}
            </div>
        </div>
    )
}
