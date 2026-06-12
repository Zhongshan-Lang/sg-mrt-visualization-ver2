import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

function Compass({ bearing, color }) {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 40 40"
            style={{ transform: `rotate(${-bearing}deg)` }}
        >
            <polygon points="20,4 13,18 20,15 27,18" fill="#e53935" />
            <polygon points="20,36 13,22 20,25 27,22" fill={color} opacity="0.5" />
        </svg>
    )
}

export default function Toolbar({
    mapRef,
    showBuildings,
    onToggleBuildings,
    theme,
    onToggleTheme,
    is2D,
    onToggle2D3D,
    bearing,
    bottom = 20
}) {
    const { t } = useTheme()
    const [resetHovered, setResetHovered] = useState(false)
    const [buildingHovered, setBuildingHovered] = useState(false)
    const [themeHovered, setThemeHovered] = useState(false)
    const [view2dHovered, setView2dHovered] = useState(false)

    const handleResetNorth = () => {
        if (!mapRef.current) return
        mapRef.current.flyTo({
            bearing: 0,
            duration: 1500,
            essential: true
        })
    }

    const btnBase = {
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: t.textPrimary,
        fontSize: '18px',
        transition: '0.25s',
        userSelect: 'none'
    }

    const buildingIcon = String.fromCodePoint(0x1F3E2)
    const themeIcon = theme === 'light'
        ? String.fromCodePoint(0x1F319)
        : String.fromCodePoint(0x2600, 0xFE0F)

    return (
        <div style={{
            position: 'absolute',
            right: 8,
            bottom,
            zIndex: 15,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
        }}>
            <div
                onClick={onToggle2D3D}
                title={is2D ? 'Switch to 3D' : 'Switch to 2D'}
                onMouseEnter={() => setView2dHovered(true)}
                onMouseLeave={() => setView2dHovered(false)}
                style={{
                    ...btnBase,
                    background: is2D
                        ? (view2dHovered ? t.buildingActiveBgHover : t.buildingActiveBg)
                        : (view2dHovered ? t.toolbarBgHover : t.toolbarBg),
                    border: is2D
                        ? `1px solid ${t.buildingActiveBorder}`
                        : `1px solid ${t.borderToolbar}`,
                    fontSize: '15px'
                }}
            >
                {is2D ? '3D' : '2D'}
            </div>

            <div
                onClick={handleResetNorth}
                title={`Reset North (${Math.round(bearing)}deg)`}
                onMouseEnter={() => setResetHovered(true)}
                onMouseLeave={() => setResetHovered(false)}
                style={{
                    ...btnBase,
                    background: resetHovered ? t.toolbarBgHover : t.toolbarBg,
                    border: `1px solid ${t.borderToolbar}`
                }}
            >
                <Compass bearing={bearing} color={t.textPrimary} />
            </div>

            <div
                onClick={onToggleBuildings}
                title={showBuildings ? 'Hide 3D Buildings' : 'Show 3D Buildings'}
                onMouseEnter={() => setBuildingHovered(true)}
                onMouseLeave={() => setBuildingHovered(false)}
                style={{
                    ...btnBase,
                    background: showBuildings
                        ? (buildingHovered ? t.buildingActiveBgHover : t.buildingActiveBg)
                        : (buildingHovered ? t.toolbarBgHover : t.toolbarBg),
                    border: showBuildings
                        ? `1px solid ${t.buildingActiveBorder}`
                        : `1px solid ${t.borderToolbar}`,
                    fontSize: '16px'
                }}
            >
                {buildingIcon}
            </div>

            <div
                onClick={onToggleTheme}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                onMouseEnter={() => setThemeHovered(true)}
                onMouseLeave={() => setThemeHovered(false)}
                style={{
                    ...btnBase,
                    background: themeHovered ? t.toolbarBgHover : t.toolbarBg,
                    border: `1px solid ${t.borderToolbar}`,
                    fontSize: '16px'
                }}
            >
                {themeIcon}
            </div>
        </div>
    )
}
