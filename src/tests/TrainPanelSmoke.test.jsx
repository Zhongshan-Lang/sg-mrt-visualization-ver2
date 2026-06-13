import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TrainPanel from '../components/Panels/TrainPanel'

vi.mock('../contexts/ThemeContext', () => ({
    useTheme: () => ({
        t: {
            panelBg: 'rgba(18,22,30,0.92)',
            overlayMedium: 'rgba(255,255,255,0.08)',
            overlayStrong: 'rgba(255,255,255,0.1)',
            textPrimary: '#fff',
            textSecondary: 'rgba(255,255,255,0.7)',
            borderStrong: 'rgba(255,255,255,0.16)'
        }
    })
}))

describe('TrainPanel smoke', () => {
    beforeEach(() => {
        window.__trainSystem = { setTrackingView: vi.fn() }
        Element.prototype.scrollIntoView = vi.fn()
    })

    it('renders train info, switches view, and closes cleanly', () => {
        const onClose = vi.fn()

        render(
            <TrainPanel
                trainData={{
                    id: 'train-1',
                    trainNum: '117/118',
                    routeKey: 'NS_MAIN',
                    lineColor: '#d42e12',
                    termCode: 'NS28',
                    nextCode: 'NS17',
                    curCode: 'NS16',
                    currentStationIndex: 1,
                    direction: 1,
                    distance: 100,
                    targetSpeed: 0.02,
                    braking: false,
                    waitTimer: 0,
                    stations: [
                        { code: 'NS16', distance: 0 },
                        { code: 'NS17', distance: 150 },
                        { code: 'NS18', distance: 320 }
                    ]
                }}
                isTrainPanelClosing={false}
                stationLabelLanguage="en"
                labelOpacity={1}
                onClose={onClose}
            />
        )

        expect(screen.getByText('Train')).toBeTruthy()
        expect(screen.getByText('117/118')).toBeTruthy()
        expect(screen.getByText('North South Line')).toBeTruthy()
        expect(screen.getByText('To')).toBeTruthy()
        expect(screen.getByText('Next')).toBeTruthy()

        fireEvent.click(screen.getByRole('button', { name: 'Follow' }))
        expect(window.__trainSystem.setTrackingView).toHaveBeenCalledWith('follow')

        fireEvent.click(screen.getByRole('button', { name: 'Close train panel' }))
        expect(onClose).toHaveBeenCalledTimes(1)
    })
})
