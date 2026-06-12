import { useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

export default function PanelCloseButton({
    onClick,
    top = 14,
    right = 14,
    variant = 'solid',
    ariaLabel = 'Close panel'
}) {
    const { t } = useTheme()
    const [isHovered, setIsHovered] = useState(false)
    const isGlass = variant === 'glass'
    const background = isGlass
        ? t.closeBtnBgGlass
        : isHovered
            ? t.closeBtnBgHover
            : t.closeBtnBg
    const color = isGlass ? t.textPrimary : 'white'

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={ariaLabel}
            style={{
                position: 'absolute',
                top,
                right,
                width: '32px',
                height: '32px',
                border: 'none',
                borderRadius: '50%',
                background,
                color,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                lineHeight: 0,
                zIndex: 20,
                transition: 'background 0.25s, backdrop-filter 0.25s, transform 0.2s',
                backdropFilter: isHovered && !isGlass ? 'blur(12px)' : undefined
            }}
        >
            <span style={{
                position: 'absolute',
                width: '14px',
                height: '2px',
                borderRadius: '999px',
                background: color,
                transform: 'rotate(45deg)',
                pointerEvents: 'none'
            }} />
            <span style={{
                position: 'absolute',
                width: '14px',
                height: '2px',
                borderRadius: '999px',
                background: color,
                transform: 'rotate(-45deg)',
                pointerEvents: 'none'
            }} />
        </button>
    )
}
