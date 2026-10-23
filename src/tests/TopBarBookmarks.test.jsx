import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import TopBar from '../components/Search/TopBar'

vi.mock('../contexts/ThemeContext', () => ({
    useTheme: () => ({
        t: {
            searchBg: '#111', panelBg: '#111', textPrimary: '#fff',
            borderStrong: '#333', borderMedium: '#333', borderLight: '#333',
            overlayMedium: '#222', overlayStrong: '#222',
            iconOpacityActive: 1, iconOpacity: 0.5, searchIconOpacity: 0.5
        }
    })
}))

describe('TopBar bookmarks', () => {
    it('shows and navigates to a bookmarked interchange station', () => {
        const onNavigateToStation = vi.fn()

        render(
            <TopBar
                searchQuery=""
                setSearchQuery={vi.fn()}
                bookmarks={['NS25-EW13', 'NS10', 'NS24-NE6-CC1']}
                showBookmarks
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
                onNavigateToStation={onNavigateToStation}
                onCalculateRoute={vi.fn()}
                onClearNavigation={vi.fn()}
                stationLabelLanguage="en"
                onCycleLanguage={vi.fn()}
                isLanguageLocked={false}
                onToggleLanguageLock={vi.fn()}
                onOpenGuide={vi.fn()}
            />
        )

        expect(screen.getByText('⭐ Admiralty')).toBeTruthy()
        const cityHall = screen.getByText('⭐ City Hall')
        expect(screen.getByText('EW13')).toBeTruthy()
        expect(screen.getByText('⭐ Dhoby Ghaut')).toBeTruthy()
        expect(screen.getByText('CC1')).toBeTruthy()
        fireEvent.click(cityHall)
        expect(onNavigateToStation).toHaveBeenCalledWith('NS25')

        fireEvent.change(screen.getByPlaceholderText('Search station / 搜索站点...'), {
            target: { value: 'City Hall' }
        })
        expect(screen.getAllByText('⭐ City Hall')).toHaveLength(2)
    })
})
