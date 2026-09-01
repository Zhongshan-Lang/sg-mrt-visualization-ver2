import { describe, expect, it, vi } from 'vitest'
import { createNativeTrainFeatures, moveNativeTrainLayerAboveNetwork } from '../systems/train/trainNative3dLayer'

describe('native 3D train features', () => {
    it('creates one enlarged, closed, elevated train footprint for each simulated train', () => {
        const features = createNativeTrainFeatures([{
            marker: { getLngLat: () => ({ toArray: () => [103.85, 1.29] }) },
            visualColor: '#009645',
        }], () => 90)

        expect(features).toHaveLength(1)
        features.forEach(feature => {
            const ring = feature.geometry.coordinates[0]
            expect(ring[0]).toEqual(ring.at(-1))
            expect(feature.properties).toMatchObject({ color: '#009645', height: 6.5, base: 0.28 })
        })
    })

    it('moves the train immediately before the building layer after map ordering is configured', () => {
        const map = {
            getStyle: () => ({ layers: [
                { id: 'mrt-train-3d-body', type: 'fill-extrusion' },
                { id: 'building', type: 'fill-extrusion' },
            ] }),
            getLayer: id => id === 'mrt-train-3d-body' ? { id } : null,
            moveLayer: vi.fn(),
        }

        moveNativeTrainLayerAboveNetwork(map)

        expect(map.moveLayer).toHaveBeenCalledWith('mrt-train-3d-body', 'building')
    })
})