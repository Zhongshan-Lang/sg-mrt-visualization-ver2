import { useTheme } from '../../contexts/ThemeContext'

export default function DesktopChromeToggle({ visible, onToggle }) {
    const { t } = useTheme()

    return (
        <button
            type="button"
            onClick={onToggle}
            title={visible ? 'Hide desktop controls · 隐藏桌面控件' : 'Show desktop controls · 显示桌面控件'}
            style={{
                position: 'absolute',
                right: 8,
                bottom: 20,
                zIndex: 21,
                width: '36px',
                height: '36px',
                borderRadius: '999px',
                border: `1px solid ${visible ? t.highlightAccent : t.borderToolbar}`,
                background: visible ? t.overlayStrong : t.toolbarBg,
                backdropFilter: 'blur(18px)',
                color: t.textPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: 0,
                boxShadow: visible ? `0 0 0 1px ${t.highlightGlowSoft}` : '0 8px 24px rgba(0,0,0,0.16)',
                transition: 'transform 0.22s ease, background 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease'
            }}
            onMouseEnter={(event) => {
                event.currentTarget.style.transform = 'scale(1.05)'
                event.currentTarget.style.background = t.toolbarBgHover
            }}
            onMouseLeave={(event) => {
                event.currentTarget.style.transform = 'scale(1)'
                event.currentTarget.style.background = visible ? t.overlayStrong : t.toolbarBg
            }}
        >
            UI
        </button>
    )
}
