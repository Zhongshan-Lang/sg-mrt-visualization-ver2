import { describe, expect, it, vi } from 'vitest'
import {
    getLineFeaturesAtPoint,
    getStationFeaturesAtPoint,
    hasLineFeatureAtPoint,
    hasStationFeatureAtPoint,
    shouldClosePanelsForMapClick
} from '../components/Map/mapInteractionPriority'

function createMapMock(resolver) {
    return {
        queryRenderedFeatures: vi.fn((point, options) => resolver(point, options))
    }
}

describe('map interaction priority', () => {
    it('treats station and line layers independently', () => {
        const map = createMapMock((_point, options) => {
            const layer = options.layers[0]
            if (layer === 'station-core') return [{ id: 'station' }]
            if (layer === 'mrt-line-layer') return [{ id: 'line' }]
            return []
        })

        expect(getStationFeaturesAtPoint(map, { x: 10, y: 20 })).toHaveLength(1)
        expect(getLineFeaturesAtPoint(map, { x: 10, y: 20 })).toHaveLength(1)
        expect(hasStationFeatureAtPoint(map, { x: 10, y: 20 })).toBe(true)
        expect(hasLineFeatureAtPoint(map, { x: 10, y: 20 })).toBe(true)
    })

    it('only closes panels when clicking truly empty map space', () => {
        const stationMap = createMapMock((_point, options) => {
            const layer = options.layers[0]
            return layer === 'station-core' ? [{ id: 'station' }] : []
        })
        const lineMap = createMapMock((_point, options) => {
            const layer = options.layers[0]
            return layer === 'mrt-line-layer' ? [{ id: 'line' }] : []
        })
        const emptyMap = createMapMock(() => [])

        expect(shouldClosePanelsForMapClick(stationMap, { x: 1, y: 1 })).toBe(false)
        expect(shouldClosePanelsForMapClick(lineMap, { x: 1, y: 1 })).toBe(false)
        expect(shouldClosePanelsForMapClick(emptyMap, { x: 1, y: 1 })).toBe(true)
    })
})
