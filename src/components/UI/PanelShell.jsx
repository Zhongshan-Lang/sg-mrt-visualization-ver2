import { useTheme } from '../../contexts/ThemeContext'

export default function PanelShell({
    children,
    className,
    side = 'left',
    top = 20,
    width = '380px',
    maxHeight,
    zIndex = 10,
    isClosing = false,
    isEntering = false,
    animation = 'line',
    display = 'block',
    scroll = false,
    style
}) {
    const { t } = useTheme()
    const enterAnimation = animation === 'station' ? 'panelEnter' : 'linePanelEnter'
    const exitAnimation = animation === 'station' ? 'panelExit' : 'linePanelExit'
    const horizontalPosition = side === 'right' ? { right: 20 } : { left: 20 }

    return (
        <div className={className} style={{
            position: 'absolute',
            top,
            ...horizontalPosition,
            width,
            maxHeight,
            background: t.panelBg,
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            overflowY: scroll ? 'overlay' : 'hidden',
            overflowX: 'hidden',
            color: t.textPrimary,
            fontFamily: 'sans-serif',
            boxShadow: t.shadowPanel,
            zIndex,
            animation: isClosing
                ? `${exitAnimation} 0.35s cubic-bezier(0.22,1,0.36,1) forwards`
                : `${enterAnimation} 0.45s cubic-bezier(0.22,1,0.36,1)`,
            display,
            flexDirection: display === 'flex' ? 'column' : undefined,
            transformOrigin: side === 'right' ? 'top right' : 'top left',
            opacity: isEntering ? 0.85 : 1,
            transform: isEntering ? 'scale(0.99)' : 'scale(1)',
            transition: animation === 'station'
                ? 'all 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
                : 'opacity 0.2s, transform 0.2s',
            ...style
        }}>
            {children}
        </div>
    )
}
