import { useCallback, useRef, useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const setStationLabelLayerVisibility = vi.fn()
const topBarMock = vi.fn(({
    chromeVisible,
    navStart,
    navEnd,
    setNavStart,
    setNavEnd,
    showRoutePanel,
    onSwapNavStations,
    onCalculateRoute
}) => (
    <div
        data-testid="topbar"
        data-visible={String(chromeVisible)}
        data-nav-start={navStart ?? ''}
        data-nav-end={navEnd ?? ''}
        data-show-route-panel={String(showRoutePanel)}
    >
        <button type="button" data-testid="nav-set-start" onClick={() => setNavStart('NS1')}>Set Start</button>
        <button type="button" data-testid="nav-set-end" onClick={() => setNavEnd('EW1')}>Set End</button>
        <button type="button" data-testid="nav-calculate" onClick={onCalculateRoute}>Calculate</button>
        <button type="button" data-testid="nav-swap" onClick={onSwapNavStations}>Swap</button>
    </div>
))
const lineBarMock = vi.fn(({ chromeVisible }) => <div data-testid="linebar" data-visible={String(chromeVisible)} />)
const toolbarMock = vi.fn(({ chromeVisible }) => <div data-testid="toolbar" data-visible={String(chromeVisible)} />)

vi.mock('../contexts/ThemeContext', () => ({
    ThemeProvider: ({ children }) => children,
    useTheme: () => ({
        theme: 'dark',
        t: {
            overlayScrollThumb: '#666',
            textPrimary: '#fff'
        },
        toggleTheme: vi.fn()
    })
}))

vi.mock('../hooks/useBookmarks', () => ({
    useBookmarks: () => ({
        bookmarks: [],
        toggleBookmark: vi.fn()
    })
}))

vi.mock('../hooks/useImageCarousel', () => ({
    useImageCarousel: () => ({
        currentImage: 0,
        setCurrentImage: vi.fn(),
        isImageHovered: false,
        setIsImageHovered: vi.fn(),
        images: []
    })
}))

vi.mock('../hooks/useLanguageCycle', () => ({
    useLanguageCycle: () => ({
        stationLabelLanguage: 'en',
        labelOpacity: 1,
        cycleLanguageNow: vi.fn(),
        isLanguageLocked: false,
        toggleLanguageLock: vi.fn()
    })
}))

vi.mock('../hooks/useCloseOnEscape', () => ({
    useCloseOnEscape: vi.fn()
}))

vi.mock('../hooks/useSimulation', () => ({
    useSimulation: () => ({
        isSimulationRunning: false,
        showTrains: false,
        simSpeed: 1,
        selectedTrain: null,
        setSelectedTrain: vi.fn(),
        toggleSimulation: vi.fn(),
        toggleTrainVisibility: vi.fn(),
        getArrivals: vi.fn(() => []),
        cycleSpeed: vi.fn(),
        initSimulation: vi.fn(),
        cleanupSimulation: vi.fn()
    })
}))

vi.mock('../hooks/usePanelState', () => ({
    usePanelState: () => ({
        hoveredLines: [],
        selectedLines: [],
        closePanel: vi.fn(),
        closeLinePanel: vi.fn(),
        setSelectedStation: vi.fn(),
        setSelectedLine: vi.fn(),
        setSelectedLines: vi.fn(),
        setHoveredLines: vi.fn(),
        setHoveredStationCodes: vi.fn(),
        setIsStationHovered: vi.fn(),
        setIsEntering: vi.fn(),
        setPopupLines: vi.fn(),
        selectedStation: null,
        isClosing: false,
        isEntering: false,
        searchQuery: '',
        setSearchQuery: vi.fn(),
        showBookmarks: false,
        setShowBookmarks: vi.fn(),
        showNavigation: false,
        setShowNavigation: vi.fn(),
        isBookmarksClosing: false,
        setIsBookmarksClosing: vi.fn(),
        isNavClosing: false,
        setIsNavClosing: vi.fn(),
        isSearchClosing: false,
        setIsSearchClosing: vi.fn(),
        navigateToStation: vi.fn(),
        isTrainPanelClosing: false,
        handleCloseTrainPanel: vi.fn(),
        selectedLine: null,
        isLineClosing: false
    })
}))

vi.mock('../hooks/useRouteNavigation', () => ({
    useRouteNavigation: ({ setShowNavigation, setIsNavClosing }) => {
        const routeResultRef = useRef(null)
        const [navStart, setNavStart] = useState(null)
        const [navEnd, setNavEnd] = useState(null)
        const [navStartQuery, setNavStartQuery] = useState('')
        const [navEndQuery, setNavEndQuery] = useState('')
        const [routeResult, setRouteResult] = useState(null)
        const [showRoutePanel, setShowRoutePanel] = useState(false)
        const [isRoutePanelClosing, setIsRoutePanelClosing] = useState(false)
        const [algorithm, setAlgorithm] = useState('bfs')

        const clearNavigation = useCallback(() => {
            setNavStart(null)
            setNavEnd(null)
            setNavStartQuery('')
            setNavEndQuery('')
            setRouteResult(null)
            routeResultRef.current = null
        }, [])

        const handleCalculateRoute = useCallback(() => {
            if (!navStart || !navEnd) return
            const nextRoute = [{ line: 'NS', stations: [navStart, navEnd] }]
            setRouteResult(nextRoute)
            routeResultRef.current = nextRoute
            setShowRoutePanel(true)
            setIsNavClosing(true)
            setTimeout(() => {
                setShowNavigation(false)
                setIsNavClosing(false)
            }, 200)
        }, [navEnd, navStart, setIsNavClosing, setShowNavigation])

        const swapNavStations = useCallback(() => {
            setNavStart(navEnd)
            setNavEnd(navStart)
            setNavStartQuery(navEndQuery)
            setNavEndQuery(navStartQuery)
            setRouteResult(null)
            routeResultRef.current = null
            setShowRoutePanel(false)
        }, [navEnd, navEndQuery, navStart, navStartQuery])

        const handleAlgorithmSwitch = useCallback((nextAlgorithm) => {
            setAlgorithm(nextAlgorithm)
        }, [])

        const handleCloseRoutePanel = useCallback(() => {
            setIsRoutePanelClosing(true)
            setTimeout(() => {
                setShowRoutePanel(false)
                setRouteResult(null)
                routeResultRef.current = null
                setIsRoutePanelClosing(false)
                clearNavigation()
            }, 350)
        }, [clearNavigation])

        const clearRouteForTrainSelection = useCallback(() => {
            setShowRoutePanel(false)
            setRouteResult(null)
            routeResultRef.current = null
        }, [])

        return {
            routeResultRef,
            navStart,
            setNavStart,
            navEnd,
            setNavEnd,
            navStartQuery,
            setNavStartQuery,
            navEndQuery,
            setNavEndQuery,
            routeResult,
            showRoutePanel,
            swapNavStations,
            handleCalculateRoute,
            clearNavigation,
            algorithm,
            handleAlgorithmSwitch,
            handleCloseRoutePanel,
            isRoutePanelClosing,
            clearRouteForTrainSelection
        }
    }
}))

vi.mock('../hooks/useMapLifecycle', () => ({
    useMapLifecycle: () => ({
        allLines: [],
        showBuildings: true,
        toggleBuildings: vi.fn(),
        isMap2D: false,
        mapBearing: 0,
        handleToggle2D3D: vi.fn(),
        isLoading: false,
        isLoadingFading: false,
        setStationLabelLayerVisibility
    })
}))

vi.mock('../components/Search/TopBar', () => ({
    default: (props) => topBarMock(props)
}))

vi.mock('../components/UI/LineBar', () => ({
    default: (props) => lineBarMock(props)
}))

vi.mock('../components/UI/Toolbar', () => ({
    default: (props) => toolbarMock(props)
}))

vi.mock('../components/UI/DesktopChromeToggle', () => ({
    default: ({ visible, onToggle }) => (
        <button type="button" data-testid="ui-toggle" data-visible={String(visible)} onClick={onToggle}>
            UI
        </button>
    )
}))

vi.mock('../components/Panels/RoutePanel', () => ({
    default: ({ navStart, navEnd, algorithm, onClose }) => (
        <div
            data-testid="route-panel"
            data-nav-start={navStart ?? ''}
            data-nav-end={navEnd ?? ''}
            data-algorithm={algorithm}
        >
            <button type="button" data-testid="route-close" onClick={onClose}>Close Route</button>
        </div>
    )
}))

beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ type: 'FeatureCollection', features: [] })
    }))
})

afterEach(() => {
    vi.useRealTimers()
})

describe('UI chrome smoke', () => {
    it('toggles chrome visibility and station label layer visibility together', async () => {
        const { default: App } = await import('../App.jsx')
        render(<App />)

        await waitFor(() => {
            expect(setStationLabelLayerVisibility).toHaveBeenCalledWith(true)
        })

        expect(screen.getByTestId('topbar').getAttribute('data-visible')).toBe('true')
        expect(screen.getByTestId('linebar').getAttribute('data-visible')).toBe('true')
        expect(screen.getByTestId('toolbar').getAttribute('data-visible')).toBe('true')

        fireEvent.click(screen.getByTestId('ui-toggle'))

        await waitFor(() => {
            expect(setStationLabelLayerVisibility).toHaveBeenLastCalledWith(false)
        })

        expect(screen.getByTestId('topbar').getAttribute('data-visible')).toBe('false')
        expect(screen.getByTestId('linebar').getAttribute('data-visible')).toBe('false')
        expect(screen.getByTestId('toolbar').getAttribute('data-visible')).toBe('false')

        fireEvent.click(screen.getByTestId('ui-toggle'))

        await waitFor(() => {
            expect(setStationLabelLayerVisibility).toHaveBeenLastCalledWith(true)
        })

        expect(screen.getByTestId('topbar').getAttribute('data-visible')).toBe('true')
        expect(screen.getByTestId('linebar').getAttribute('data-visible')).toBe('true')
        expect(screen.getByTestId('toolbar').getAttribute('data-visible')).toBe('true')
    })

})
