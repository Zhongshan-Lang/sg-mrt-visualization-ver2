import { describe, expect, it } from 'vitest'
import { isTrain3dPrototypeEnabled } from '../systems/train3d/train3dMode'

describe('3D train prototype mode', () => {
    it('only enables the experimental renderer with an explicit URL flag', () => {
        expect(isTrain3dPrototypeEnabled('')).toBe(false)
        expect(isTrain3dPrototypeEnabled('?train3d=0')).toBe(false)
        expect(isTrain3dPrototypeEnabled('?train3d=1')).toBe(true)
    })
})