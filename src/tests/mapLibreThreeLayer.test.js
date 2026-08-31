import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { MapLibreThreeLayer, getLocalMercatorPosition } from '../systems/train3d/mapLibreThreeLayer'

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

    it('accepts MapLibre 5 render arguments without corrupting the camera matrix', () => {
        const layer = new MapLibreThreeLayer({ id: 'test-layer' })
        layer.map = {
            transform: {
                _fov: 1,
                _camera: { position: [0, 0, 1] },
                _horizonShift: 1,
                pixelsPerMeter: 1,
                worldSize: 1,
                _pitch: 0,
                width: 100,
                height: 100,
            },
            getBearing: () => 0,
        }
        layer.modelOrigin = { x: 0.5, y: 0.5 }
        layer.renderer = { resetState: vi.fn(), render: vi.fn() }
        layer.directionalLight = new THREE.DirectionalLight()
        layer.ambientLight = new THREE.AmbientLight()

        layer.render(null, {
            defaultProjectionData: {
                mainMatrix: [2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
            },
            modelViewProjectionMatrix: [3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1],
            projectionMatrix: [4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 1],
        })

        expect(layer.camera.projectionMatrix.elements[0]).toBe(2)
        expect(layer.camera.matrixWorldInverse.elements.every(Number.isFinite)).toBe(true)
        expect(layer.renderer.render).toHaveBeenCalledOnce()
    })
})