import { describe, expect, it } from 'vitest'
import { createPropertyExpression, v8 } from '@maplibre/maplibre-gl-style-spec'
import { buildStationLabelOpacityExpression } from '../hooks/useMapLifecycle'

describe('station label opacity', () => {
    it('uses a MapLibre-valid zoom expression for text-opacity', () => {
        const result = createPropertyExpression(
            buildStationLabelOpacityExpression(0.5),
            v8.paint_symbol['text-opacity']
        )

        expect(result.result).toBe('success')
    })
})