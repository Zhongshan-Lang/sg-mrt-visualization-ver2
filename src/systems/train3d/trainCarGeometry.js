import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export const TRAIN_CAR_DIMENSIONS = Object.freeze({
    width: 3.1,
    length: 22,
    height: 3.6,
    windowHeight: 1.15,
    windowBottom: 1.35,
})

function createWindowGeometry(size, position) {
    const geometry = new THREE.BoxGeometry(...size)
    geometry.translate(...position)
    return geometry
}

// The body, roof, and glazing are merged into one BufferGeometry. This avoids
// the independently-rendered, near-coplanar boxes that caused the earlier z-fighting.
export function createTrainCarGeometry(dimensions = TRAIN_CAR_DIMENSIONS) {
    const { width, length, height, windowHeight, windowBottom } = dimensions
    const bodyHeight = height - 0.28
    const windowCenterZ = windowBottom + windowHeight / 2
    const windowDepth = 0.035

    const body = new THREE.BoxGeometry(width, length, bodyHeight, 1, 8, 1)
    body.translate(0, 0, bodyHeight / 2)

    const roof = new THREE.BoxGeometry(width - 0.18, length - 0.3, 0.28, 1, 8, 1)
    roof.translate(0, 0, bodyHeight + 0.14)

    const sideWidth = length - 1.1
    const frontWidth = width - 0.72
    const windows = [
        createWindowGeometry([windowDepth, sideWidth, windowHeight], [width / 2 + windowDepth / 2, 0, windowCenterZ]),
        createWindowGeometry([windowDepth, sideWidth, windowHeight], [-width / 2 - windowDepth / 2, 0, windowCenterZ]),
        createWindowGeometry([frontWidth, windowDepth, windowHeight], [0, length / 2 + windowDepth / 2, windowCenterZ]),
        createWindowGeometry([frontWidth, windowDepth, windowHeight], [0, -length / 2 - windowDepth / 2, windowCenterZ]),
    ]

    const geometry = mergeGeometries([body, roof, ...windows], true)
    ;[body, roof, ...windows].forEach(part => part.dispose())

    if (!geometry) {
        throw new Error('Unable to merge train-car geometry')
    }

    geometry.groups.forEach((group, index) => {
        group.materialIndex = index < 2 ? 0 : 1
    })
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    return geometry
}

export function createTrainCarMaterials(lineColor) {
    return [
        new THREE.MeshStandardMaterial({ color: lineColor, roughness: 0.62, metalness: 0.08 }),
        new THREE.MeshStandardMaterial({ color: '#17212b', roughness: 0.28, metalness: 0.32 }),
    ]
}
