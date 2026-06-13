import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TopBar from '../components/Search/TopBar'

vi.mock('../contexts/ThemeContext', () => ({
    useTheme: () => ({
        t: {
            searchBg: 'rgba(15,15,15,0.9)',
            borderStrong: 'rgba(255,255,255,0.1)',
            borderMedium: 'rgba(255,255,255,0.14)',
            overlayMedium: 'rgba(255,255,255,0.06)',
            overlayStrong: 'rgba(255,255,255,0.1)',
            textPrimary: '#fff',
            iconOpacityActive: 1,
            iconOpacity: 0.5,
            searchIconOpacity: 0.5,
            highlightAccent: '#ffd65e',
            highlightGlowSoft: 'rgba(255,214,94,0.25)',
            highlightGlowMedium: 'rgba(255,214,94,0.55)',
            highlightGlowStrong: 'rgba(255,214,94,0.85)',
            shadowPopup: '0 10px 40px rgba(0,0,0,0.32)',
            panelBg: 'rgba(18,22,30,0.92)',
            navDropdownBg: 'rgba(30,30,30,0.98)'
        }
    })
}))

describe('TopBar language lock', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('reveals the lock control after hover delay and toggles lock state', () => {
        const onToggleLanguageLock = vi.fn()

        render(
            <TopBar
                chromeVisible
                searchQuery=""
                setSearchQuery={vi.fn()}
                bookmarks={[]}
                showBookmarks={false}
                setShowBookmarks={vi.fn()}
                showNavigation={false}
                setShowNavigation={vi.fn()}
                isBookmarksClosing={false}
                setIsBookmarksClosing={vi.fn()}
                isNavClosing={false}
                setIsNavClosing={vi.fn()}
                isSearchClosing={false}
                setIsSearchClosing={vi.fn()}
                navStart={null}
                setNavStart={vi.fn()}
                navEnd={null}
                setNavEnd={vi.fn()}
                navStartQuery=""
                setNavStartQuery={vi.fn()}
                navEndQuery=""
                setNavEndQuery={vi.fn()}
                showRoutePanel={false}
                onSwapNavStations={vi.fn()}
                onNavigateToStation={vi.fn()}
                onCalculateRoute={vi.fn()}
                onClearNavigation={vi.fn()}
                stationLabelLanguage="en"
                onCycleLanguage={vi.fn()}
                isLanguageLocked={false}
                onToggleLanguageLock={onToggleLanguageLock}
                onOpenGuide={vi.fn()}
            />
        )

        const languageButton = screen.getByRole('button', { name: 'EN' })
        act(() => {
            fireEvent.mouseEnter(languageButton.parentElement)
            vi.advanceTimersByTime(1000)
        })

        const lockButton = screen.getByRole('button', { name: /lock/i })
        fireEvent.click(lockButton)
        expect(onToggleLanguageLock).toHaveBeenCalledTimes(1)

        act(() => {
            fireEvent.mouseLeave(languageButton.parentElement)
            vi.advanceTimersByTime(450)
        })
        expect(screen.queryByRole('button', { name: /lock/i })).toBeNull()
    })
})
