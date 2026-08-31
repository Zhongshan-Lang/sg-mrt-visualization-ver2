import { describe, expect, it } from 'vitest'
import { isTrain3dPrototypeEnabled } from '../systems/train3d/train3dMode'

describe('3D train prototype mode', () => {
    it('enables the requested 3D renderer by default and supports an explicit rollback flag', () => {
        expect(isTrain3dPrototypeEnabled('')).toBe(true)
        expect(isTrain3dPrototypeEnabled('?train3d=0')).toBe(false)
        expect(isTrain3dPrototypeEnabled('?train3d=1')).toBe(true)
    })
})