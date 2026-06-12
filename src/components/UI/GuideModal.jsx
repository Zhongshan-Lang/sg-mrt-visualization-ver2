import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

const guideCopy = {
    zh: {
        title: '使用教程',
        subtitle: '快速了解搜索、路线、车站、线路、列车与地图视角。',
        close: '关闭',
        languageLabel: '中文',
        switchLanguage: 'Switch to English',
        sections: [
            {
                title: '搜索',
                items: [
                    '在顶部搜索栏输入英文、中文或站点编号，可以快速查找车站。',
                    '点击搜索结果会打开车站面板，并把镜头平滑移动到该站。',
                    '星标按钮可以收藏常用车站，之后从收藏列表快速打开。'
                ]
            },
            {
                title: '路线规划',
                items: [
                    '点击搜索栏里的指南针图标打开路线规划。',
                    '选择起点和终点后点击查询路线，地图会高亮本次行程。',
                    '路线面板里可以切换站点更少、距离更短、换乘更少三种规划方式。'
                ]
            },
            {
                title: '车站',
                items: [
                    '点击地图上的车站核心点可以打开车站面板。',
                    '车站面板会显示线路、预报、设施、出口和附近地标。',
                    '远景下优先显示换乘站和线路端点站，拉近后普通站点会出现。'
                ]
            },
            {
                title: '线路',
                items: [
                    '点击线路或左下角线路胶囊可以打开线路面板。',
                    '线路全局镜头会尽量让所有站点避开左侧面板并保持在屏幕内。',
                    '停留数秒后会进入线路巡游，手动操作地图会退出巡游。'
                ]
            },
            {
                title: '列车',
                items: [
                    '左下角可以开启列车模拟和列车显示。',
                    '悬停列车查看简要信息，点击列车打开列车面板。',
                    '列车面板会显示开往方向、下一站、途经站点和预计到达时间。'
                ]
            },
            {
                title: '地图视角',
                items: [
                    '右侧工具栏可以切换日夜模式、建筑显示和 2D/3D 视角。',
                    '鼠标滚轮缩放，拖拽移动地图，右键或触控板可以旋转视角。',
                    '路线、线路或列车镜头运行时，手动操作会回到自由控制。'
                ]
            },
            {
                title: '语言',
                items: [
                    '搜索栏右侧语言按钮可以手动切换英文、中文、泰米尔语。',
                    '悬停语言按钮约 1 秒会出现锁定按钮。',
                    '锁定后全局文字会停留在当前语言，再次点击可解除锁定。'
                ]
            }
        ]
    },
    en: {
        title: 'Guide',
        subtitle: 'A quick tour of search, routes, stations, lines, trains, and camera controls.',
        close: 'Close',
        languageLabel: 'EN',
        switchLanguage: '切换到中文',
        sections: [
            {
                title: 'Search',
                items: [
                    'Use English, Chinese, or station codes in the top search bar to find stations.',
                    'Selecting a result opens the station panel and moves the camera to that station.',
                    'Use the star button to bookmark frequent stations for faster access.'
                ]
            },
            {
                title: 'Route Planner',
                items: [
                    'Click the compass icon in the search bar to open route planning.',
                    'Choose a start and destination, then find a route to highlight the journey.',
                    'The route panel can switch between fewer stops, shorter distance, and fewer transfers.'
                ]
            },
            {
                title: 'Stations',
                items: [
                    'Click a station core on the map to open the station panel.',
                    'The station panel shows lines, forecasts, facilities, exits, and nearby landmarks.',
                    'At wider zoom levels, transfer and terminal stations stay visible first.'
                ]
            },
            {
                title: 'Lines',
                items: [
                    'Click a line on the map or a line pill in the lower-left list to open the line panel.',
                    'The overview camera keeps the selected line visible while avoiding the left panel.',
                    'After a short pause, line tour starts automatically. Manual map input exits the tour.'
                ]
            },
            {
                title: 'Trains',
                items: [
                    'Use the lower-left controls to enable train simulation and train display.',
                    'Hover a train for a compact popup, or click it to open the train panel.',
                    'The train panel shows destination, next station, full stop list, and arrival estimates.'
                ]
            },
            {
                title: 'Map View',
                items: [
                    'Use the right toolbar to switch day/night mode, buildings, and 2D/3D view.',
                    'Scroll to zoom, drag to pan, and use right-drag or trackpad gestures to rotate.',
                    'Manual interaction returns the map to free control during route, line, or train cameras.'
                ]
            },
            {
                title: 'Language',
                items: [
                    'The language button switches English, Chinese, and Tamil labels.',
                    'Hover the language button for about 1 second to reveal the lock control.',
                    'When locked, global labels stay on the current language until unlocked.'
                ]
            }
        ]
    }
}

export default function GuideModal({ onClose }) {
    const { t, theme } = useTheme()
    const [language, setLanguage] = useState('zh')
    const [isClosing, setIsClosing] = useState(false)
    const closeTimerRef = useRef(null)
    const copy = guideCopy[language]

    const requestClose = () => {
        if (isClosing) return
        setIsClosing(true)
        closeTimerRef.current = setTimeout(onClose, 220)
    }

    useEffect(() => {
        const onKeyDown = (event) => {
            if (event.key === 'Escape') requestClose()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [isClosing])

    useEffect(() => () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }, [])

    return (
        <div
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) requestClose()
            }}
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                background: theme === 'dark' ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(14px)',
                animation: isClosing
                    ? 'guideBackdropOut 0.22s cubic-bezier(0.22,1,0.36,1) forwards'
                    : 'guideBackdropIn 0.24s cubic-bezier(0.22,1,0.36,1)'
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-label={copy.title}
                onMouseDown={(event) => event.stopPropagation()}
                className="nav-scroll"
                style={{
                    width: 'min(920px, calc(100vw - 48px))',
                    maxHeight: 'min(760px, calc(100vh - 48px))',
                    overflowY: 'auto',
                    background: theme === 'dark' ? 'rgba(18,18,18,0.78)' : 'rgba(255,255,255,0.76)',
                    backdropFilter: 'blur(28px) saturate(1.25)',
                    border: `1px solid ${t.borderStrong}`,
                    borderRadius: '22px',
                    boxShadow: t.shadowPanel,
                    color: t.textPrimary,
                    fontFamily: 'sans-serif',
                    transformOrigin: 'center',
                    animation: isClosing
                        ? 'guideModalOut 0.22s cubic-bezier(0.22,1,0.36,1) forwards'
                        : 'guideModalIn 0.32s cubic-bezier(0.22,1,0.36,1)'
                }}
            >
                <header style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    padding: '22px 24px 18px',
                    background: theme === 'dark' ? 'rgba(18,18,18,0.72)' : 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: `1px solid ${t.borderLight}`
                }}>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '24px', fontWeight: 800, lineHeight: 1.15 }}>
                            {copy.title}
                        </div>
                        <div style={{ marginTop: '7px', fontSize: '13px', color: t.textSecondary, lineHeight: 1.35 }}>
                            {copy.subtitle}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button
                            type="button"
                            onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
                            title={copy.switchLanguage}
                            style={{
                                height: '34px',
                                padding: '0 12px',
                                borderRadius: '999px',
                                border: `1px solid ${t.borderMedium}`,
                                background: t.overlayMedium,
                                color: t.textPrimary,
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 800
                            }}
                        >
                            {copy.languageLabel}
                        </button>
                        <button
                            type="button"
                            onClick={requestClose}
                            title={copy.close}
                            style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '999px',
                                border: `1px solid ${t.borderMedium}`,
                                background: t.closeBtnBgGlass,
                                color: t.textPrimary,
                                cursor: 'pointer',
                                fontSize: '22px',
                                lineHeight: 1,
                                flexShrink: 0
                            }}
                        >
                            ×
                        </button>
                    </div>
                </header>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '12px',
                    padding: '18px 20px 22px'
                }}>
                    {copy.sections.map((section) => (
                        <article
                            key={section.title}
                            style={{
                                background: t.overlayMedium,
                                border: `1px solid ${t.borderMedium}`,
                                borderRadius: '14px',
                                padding: '16px',
                                minHeight: '150px'
                            }}
                        >
                            <h2 style={{
                                margin: 0,
                                fontSize: '15px',
                                fontWeight: 800,
                                color: t.textPrimary
                            }}>
                                {section.title}
                            </h2>
                            <ul style={{
                                margin: '12px 0 0',
                                paddingLeft: '18px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                color: t.textSecondary,
                                fontSize: '13px',
                                lineHeight: 1.45
                            }}>
                                {section.items.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    )
}
