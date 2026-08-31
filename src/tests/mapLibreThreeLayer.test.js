import { describe, expect, it } from 'vitest'
import { getLocalMercatorPosition } from '../systems/train3d/mapLibreThreeLayer'

describe('MapLibre Three layer coordinates', () => {
    it('maps world Mercator coordinates into the layer-local right-handed space', () => {
        const local = getLocalMercatorPosition(
            { x: 0.5, y: 0.5 },
            { x: 0.50001, y: 0.49998, z: 0.000001 }
        )

        expect(local.x).toBeCloseTo(0.00001)
        expect(local.y).toBeCloseTo(0.00002)
        expect(local.z).toBeCloseTo(0.000001)
    })
})
