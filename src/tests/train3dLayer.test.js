import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { TRAIN_3D_LAYER_ID, Train3DLayer, trainHeadingToModelYaw } from '../systems/train/train3dLayer'

describe('3D train layer', () => {
    it('registers as a depth-aware custom layer before the building layer', () => {
        const map = {
            getLayer: vi.fn(() => null),
            addLayer: vi.fn(),
            triggerRepaint: vi.fn()
        }
        const layer = new Train3DLayer(map)

        layer.add('building-extrusion')

        expect(layer.id).toBe(TRAIN_3D_LAYER_ID)
        expect(layer.type).toBe('custom')
        expect(layer.renderingMode).toBe('3d')
        expect(map.addLayer).toHaveBeenCalledWith(layer, 'building-extrusion')
    })

    it('keeps renderer visibility and movement data independent from DOM markers', () => {
        const map = {
            getLayer: vi.fn(() => null),
            addLayer: vi.fn(),
            triggerRepaint: vi.fn()
        }
        const layer = new Train3DLayer(map)
        const trains = [{ heading: 90, marker: { getLngLat: vi.fn() } }]

        layer.sync(trains)
        layer.setVisible(false)

        expect(layer.trains).toBe(trains)
        expect(layer.visible).toBe(false)
        expect(map.triggerRepaint).toHaveBeenCalledOnce()
        expect(trainHeadingToModelYaw(180)).toBeCloseTo(Math.PI)
    })

    it('uses MapLibre mainMatrix as the camera projection for the shared WebGL context', () => {
        const map = {
            getLayer: vi.fn(() => null),
            addLayer: vi.fn(),
            triggerRepaint: vi.fn()
        }
        const layer = new Train3DLayer(map)
        const render = vi.fn()
        const mainMatrix = new Float32Array(16)
        mainMatrix[0] = 7

        layer.renderer = { resetState: vi.fn(), render }
        layer.camera = new THREE.Camera()
        layer.scene = new THREE.Scene()

        layer.render(null, { defaultProjectionData: { mainMatrix } })

        expect(layer.camera.projectionMatrix.elements[0]).toBe(7)
        expect(render).toHaveBeenCalledWith(layer.scene, layer.camera)
    })
})
