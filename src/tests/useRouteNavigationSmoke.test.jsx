import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRouteNavigation } from '../hooks/useRouteNavigation'

const calculateRoute = vi.fn((start, end, algorithm) => [
    { line: algorithm === 'dijkstra' ? 'EW' : 'NS', stations: [start, end] }
])
const createRouteMarkers = vi.fn()
const createRouteHighlight = vi.fn(() => [])
const choreographRouteCamera = vi.fn()
const clearRouteMarkers = vi.fn()
const clearRouteHighlight = vi.fn()
const clearRouteCameraChoreography = vi.fn()

vi.mock('../utils/routeModule', () => ({
    loadRouteUtils: vi.fn(() => Promise.resolve({
        calculateRoute,
        createRouteMarkers,
        createRouteHighlight,
        choreographRouteCamera,
        clearRouteMarkers,
        clearRouteHighlight,
        clearRouteCameraChoreography
    }))
}))

beforeEach(() => {
    vi.clearAllMocks()
})

afterEach(() => {
    vi.useRealTimers()
})

describe('useRouteNavigation smoke', () => {
    it('opens, swaps, and closes route state cleanly', async () => {
        const setSelectedLines = vi.fn()
        const setHoveredLines = vi.fn()
        const setShowNavigation = vi.fn()
        const setIsNavClosing = vi.fn()
        const mapRef = { current: null }
        const mrtData = { features: [] }

        const { result } = renderHook(() => useRouteNavigation({
            mapRef,
            mrtData,
            setSelectedLines,
            setHoveredLines,
            setShowNavigation,
            setIsNavClosing
        }))

        act(() => {
            result.current.setNavStart('NS1')
            result.current.setNavEnd('EW1')
        })

        await act(async () => {
            await result.current.handleCalculateRoute()
        })

        expect(result.current.showRoutePanel).toBe(true)
        expect(result.current.routeResult).toEqual([{ line: 'NS', stations: ['NS1', 'EW1'] }])
        expect(calculateRoute).toHaveBeenCalledWith('NS1', 'EW1', 'bfs', mrtData)

        act(() => {
            result.current.swapNavStations()
        })

        expect(result.current.navStart).toBe('EW1')
        expect(result.current.navEnd).toBe('NS1')
        expect(result.current.routeResult).toBe(null)
        expect(result.current.routeResultRef.current).toBe(null)

        await act(async () => {
            await result.current.handleCalculateRoute()
        })

        expect(result.current.showRoutePanel).toBe(true)
        vi.useFakeTimers()

        act(() => {
            result.current.handleCloseRoutePanel()
        })

        expect(result.current.isRoutePanelClosing).toBe(true)

        await act(async () => {
            await vi.advanceTimersByTimeAsync(350)
        })

        expect(result.current.showRoutePanel).toBe(false)
        expect(result.current.routeResult).toBe(null)
        expect(result.current.navStart).toBe(null)
        expect(result.current.navEnd).toBe(null)
        expect(setSelectedLines).toHaveBeenCalledWith([])
        expect(setHoveredLines).toHaveBeenCalledWith([])
    })
})
