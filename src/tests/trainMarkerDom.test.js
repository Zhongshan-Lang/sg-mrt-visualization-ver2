import { describe, expect, it } from 'vitest'
import { createTrainMarkerDom } from '../systems/train/trainMarkerDom'

describe('2.5D train marker', () => {
    it('builds a layered car body and enlarges it while tracked', () => {
        const { el, bodyEl, syncMarkerSize } = createTrainMarkerDom({
            color: '#d42e12',
            trainIndex: 3
        })

        syncMarkerSize({ isTracked: false })

        expect(el.getAttribute('data-train-idx')).toBe('3')
        expect(bodyEl.children).toHaveLength(2)
        expect(bodyEl.style.transform).toBe('translate(-5.5px, -11.5px)')
        expect(bodyEl.style.width).toBe('11px')
        expect(bodyEl.style.height).toBe('23px')

        syncMarkerSize({ isTracked: true })

        expect(bodyEl.style.transform).toBe('translate(-7.5px, -15.5px)')
        expect(bodyEl.style.zIndex).toBe('8')
    })
})