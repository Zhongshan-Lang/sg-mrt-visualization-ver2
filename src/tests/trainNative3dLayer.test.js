import { describe, expect, it } from 'vitest'
import { createNativeTrainFeatures } from '../systems/train/trainNative3dLayer'

describe('native 3D train features', () => {
    it('creates four closed, elevated car footprints for each simulated train', () => {
        const features = createNativeTrainFeatures([{
            marker: { getLngLat: () => ({ toArray: () => [103.85, 1.29] }) },
            visualColor: '#009645',
        }], () => 90)

        expect(features).toHaveLength(4)
        features.forEach(feature => {
            const ring = feature.geometry.coordinates[0]
            expect(ring[0]).toEqual(ring.at(-1))
            expect(feature.properties).toMatchObject({ color: '#009645', height: 3.6, base: 0.28 })
        })
    })
})