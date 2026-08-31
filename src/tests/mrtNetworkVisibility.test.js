import { describe, expect, it, vi } from 'vitest'
import { MRT_NETWORK_LAYER_IDS, setMrtNetworkLayerVisibility } from '../components/Map/mapLayerOrdering'

describe('MRT network visibility', () => {
    it('toggles only MRT layers and leaves the basemap and buildings untouched', () => {
        const map = {
            getLayer: vi.fn(id => id === 'building' ? { id } : { id }),
            setLayoutProperty: vi.fn(),
            triggerRepaint: vi.fn()
        }

        setMrtNetworkLayerVisibility(map, false)

        expect(map.setLayoutProperty).toHaveBeenCalledTimes(MRT_NETWORK_LAYER_IDS.length)
        expect(map.setLayoutProperty).toHaveBeenCalledWith('mrt-line-layer', 'visibility', 'none')
        expect(map.setLayoutProperty).toHaveBeenCalledWith('station-core', 'visibility', 'none')
        expect(map.setLayoutProperty).toHaveBeenCalledWith('station-labels', 'visibility', 'none')
        expect(map.setLayoutProperty).toHaveBeenCalledWith('route-highlight-layer', 'visibility', 'none')
        expect(map.setLayoutProperty).not.toHaveBeenCalledWith('building', 'visibility', 'none')
        expect(map.triggerRepaint).toHaveBeenCalledOnce()
    })

    it('restores every MRT layer without changing other map layers', () => {
        const map = {
            getLayer: vi.fn(() => ({})),
            setLayoutProperty: vi.fn(),
            triggerRepaint: vi.fn()
        }

        setMrtNetworkLayerVisibility(map, true)

        expect(map.setLayoutProperty).toHaveBeenCalledTimes(MRT_NETWORK_LAYER_IDS.length)
        expect(map.setLayoutProperty).toHaveBeenCalledWith('mrt-line-glow', 'visibility', 'visible')
        expect(map.setLayoutProperty).toHaveBeenCalledWith('station-entrance', 'visibility', 'visible')
        expect(map.setLayoutProperty).toHaveBeenCalledWith('route-flow-layer', 'visibility', 'visible')
    })
})