import { describe, expect, it, vi } from 'vitest'
import { createNativeTrainFeatures, getNativeTrainSizeScale, getSelectedTrainPulse, getTrainForNativeFeature, moveNativeTrainLayerAboveNetwork } from '../systems/train/trainNative3dLayer'

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

    it('maps an extruded feature back to its original train object', () => {
        const train = { id: 'EW_MAIN_3', marker: { getLngLat: () => ({ toArray: () => [103.85, 1.29] }) }, visualColor: '#009645' }
        const [feature] = createNativeTrainFeatures([train], () => 90)

        expect(feature.properties.trainId).toBe('EW_MAIN_3')
        expect(getTrainForNativeFeature([train], feature)).toBe(train)
        expect(getTrainForNativeFeature([train], { properties: { trainId: 'missing' } })).toBeNull()
    })

    it('smoothly adapts the train size to camera zoom', () => {
        expect(getNativeTrainSizeScale(10)).toBe(5)
        expect(getNativeTrainSizeScale(13)).toBeCloseTo(3.5)
        expect(getNativeTrainSizeScale(15)).toBe(2)
        expect(getNativeTrainSizeScale(19)).toBe(1.05)
        expect(getNativeTrainSizeScale(22)).toBe(1.05)

        const [feature] = createNativeTrainFeatures([{
            marker: { getLngLat: () => ({ toArray: () => [103.85, 1.29] }) },
            visualColor: '#009645',
        }], () => 90, 5)
        expect(feature.properties.height).toBe(32.5)
    })

    it('moves the selection aura and train immediately before the building layer', () => {
        const map = {
            getStyle: () => ({ layers: [
                { id: 'mrt-train-3d-selection-aura', type: 'circle' },
                { id: 'mrt-train-3d-body', type: 'fill-extrusion' },
                { id: 'building', type: 'fill-extrusion' },
            ] }),
            getLayer: id => id.startsWith('mrt-train-3d-') ? { id } : null,
            moveLayer: vi.fn(),
        }

        moveNativeTrainLayerAboveNetwork(map)

        expect(map.moveLayer).toHaveBeenNthCalledWith(1, 'mrt-train-3d-selection-aura', 'building')
        expect(map.moveLayer).toHaveBeenNthCalledWith(2, 'mrt-train-3d-body', 'building')
    })

    it('adds a radial aura only for the selected train', () => {
        const train = {
            id: 'EW_MAIN_3',
            marker: { getLngLat: () => ({ toArray: () => [103.85, 1.29] }) },
            visualColor: '#009645',
        }

        const features = createNativeTrainFeatures([train], () => 90, 1, train.id)
        const glow = features.find(feature => feature.properties.isHighlight)
        const body = features.find(feature => !feature.properties.isHighlight)

        expect(features).toHaveLength(2)
        expect(glow.geometry.type).toBe('Point')
        expect(glow.properties).toMatchObject({ trainId: train.id, isHighlight: true })
        expect(body.geometry.type).toBe('Polygon')
    })
    it('breathes smoothly between a soft and bright selected-train glow', () => {
        expect(getSelectedTrainPulse(0)).toBeCloseTo(0.5)
        expect(getSelectedTrainPulse(450)).toBeCloseTo(1)
        expect(getSelectedTrainPulse(1350)).toBeCloseTo(0)
    })
})
