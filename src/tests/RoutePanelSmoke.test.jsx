import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RoutePanel from '../components/Panels/RoutePanel'

const {
    getStationAccessDataForStation,
    getStationLines
} = vi.hoisted(() => ({
    getStationAccessDataForStation: vi.fn(),
    getStationLines: vi.fn((stationCode) => {
        if (stationCode === 'NS17' || stationCode === 'CC15') return ['NS', 'CC']
        if (stationCode.startsWith('CC')) return ['CC']
        return ['NS']
    })
}))

getStationLines.mockImplementation((stationCode) => {
    if (stationCode === 'NS17' || stationCode === 'CC15') return ['NS', 'CC']
    if (stationCode.startsWith('CC')) return ['CC']
    return ['NS']
})

vi.mock('../contexts/ThemeContext', () => ({
    useTheme: () => ({
        theme: 'dark',
        t: {
            panelBg: 'rgba(18, 22, 30, 0.92)',
            textPrimary: '#ffffff',
            textSecondary: 'rgba(255,255,255,0.72)',
            overlayStrong: 'rgba(255,255,255,0.1)',
            overlayMedium: 'rgba(255,255,255,0.08)',
            overlayLight: 'rgba(255,255,255,0.06)',
            borderMedium: 'rgba(255,255,255,0.2)',
            shadowPanel: '0 18px 48px rgba(0,0,0,0.35)',
            startDot: '#49d17d',
            startDotGlow: '0 0 10px rgba(73,209,125,0.45)',
            endDot: '#ff6b6b',
            endDotGlow: '0 0 10px rgba(255,107,107,0.4)',
            entranceMarker: '#ffd54f',
            closeBtnBg: 'rgba(255,255,255,0.16)',
            closeBtnBgHover: 'rgba(255,255,255,0.24)',
            closeBtnBgGlass: 'rgba(255,255,255,0.12)'
        }
    })
}))

vi.mock('../data/loaders/stationAccessData', () => ({
    getStationAccessDataForStation
}))

vi.mock('../routing/navigationUtils', () => ({
    getStationLines
}))

describe('RoutePanel smoke', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        getStationAccessDataForStation.mockResolvedValue({
            stationCodes: 'CC17-TE9',
            entrances: [
                { name: 'A' },
                { name: 'B' }
            ],
            landmarks: {
                A: [
                    { name: 'Tower 1' },
                    { name: 'Bus Interchange' }
                ],
                B: [
                    { name: 'Office Lobby' }
                ]
            }
        })
    })

    it('renders stats, switches algorithm, and wires key route actions', async () => {
        const onAlgorithmChange = vi.fn()
        const onClose = vi.fn()
        const onNavigateToStation = vi.fn()

        render(
            <RoutePanel
                routeResult={[
                    { line: 'NS', stations: ['NS16', 'NS17'] },
                    { line: 'CC', stations: ['CC15', 'CC16', 'CC17'] }
                ]}
                navStart="NS16"
                navEnd="CC17"
                isRoutePanelClosing={false}
                stationLabelLanguage="en"
                labelOpacity={1}
                algorithm="bfs"
                onAlgorithmChange={onAlgorithmChange}
                onClose={onClose}
                onNavigateToStation={onNavigateToStation}
            />
        )

        expect(screen.getByText('Route')).toBeTruthy()
        expect(screen.getByText('5 Stations')).toBeTruthy()
        expect(screen.getByText('3.8 km')).toBeTruthy()
        expect(screen.getByText('S$1.38')).toBeTruthy()
        expect(screen.getByText('North South Line')).toBeTruthy()
        expect(screen.getByText('Circle Line')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Fewest Transfers' }))
        expect(onAlgorithmChange).toHaveBeenCalledWith('fewest-transfers')

        fireEvent.click(screen.getByRole('button', { name: 'Close route panel' }))
        expect(onClose).toHaveBeenCalledTimes(1)

        fireEvent.click(screen.getByRole('button', { name: 'Caldecott' }))
        expect(onNavigateToStation).toHaveBeenCalledWith('CC17')

        await waitFor(() => {
            expect(getStationAccessDataForStation).toHaveBeenCalledWith('CC17-TE9')
        })

        expect(screen.getByText('Suggested exit')).toBeTruthy()
        expect(screen.getByText('A')).toBeTruthy()
        expect(screen.getByText(/Tower 1/)).toBeTruthy()
        expect(screen.getByText(/Bus Interchange/)).toBeTruthy()
    })
})
