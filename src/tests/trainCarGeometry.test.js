import { describe, expect, it } from 'vitest'
import { TRAIN_CAR_DIMENSIONS, createTrainCarGeometry } from '../systems/train3d/trainCarGeometry'

describe('train car geometry', () => {
    it('creates one merged car geometry with non-coplanar glazing', () => {
        const geometry = createTrainCarGeometry()

        expect(geometry.groups).toHaveLength(6)
        expect(new Set(geometry.groups.map(group => group.materialIndex))).toEqual(new Set([0, 1]))
        expect(geometry.boundingBox.min.z).toBeCloseTo(0)
        expect(geometry.boundingBox.max.z).toBeCloseTo(TRAIN_CAR_DIMENSIONS.height)

        geometry.dispose()
    })
})
