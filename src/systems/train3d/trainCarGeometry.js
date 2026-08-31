import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export const TRAIN_CAR_DIMENSIONS = Object.freeze({
    width: 3.1,
    length: 22,
    height: 3.6,
    windowHeight: 1.15,
    windowBottom: 1.35,
})

export const TRAIN_CAR_COUNT = 4
const TRAIN_CAR_GAP_METERS = 0.8
const PARTS_PER_CAR = 6

function createWindowGeometry(size, position) {
    const geometry = new THREE.BoxGeometry(...size)
    geometry.translate(...position)
    return geometry
}

function createTrainCarParts(dimensions) {
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
    return [
        body,
        roof,
        createWindowGeometry([windowDepth, sideWidth, windowHeight], [width / 2 + windowDepth / 2, 0, windowCenterZ]),
        createWindowGeometry([windowDepth, sideWidth, windowHeight], [-width / 2 - windowDepth / 2, 0, windowCenterZ]),
        createWindowGeometry([frontWidth, windowDepth, windowHeight], [0, length / 2 + windowDepth / 2, windowCenterZ]),
        createWindowGeometry([frontWidth, windowDepth, windowHeight], [0, -length / 2 - windowDepth / 2, windowCenterZ]),
    ]
}

function mergeTrainParts(parts) {
    const geometry = mergeGeometries(parts, true)
    parts.forEach(part => part.dispose())

    if (!geometry) {
        throw new Error('Unable to merge train-car geometry')
    }

    geometry.groups.forEach((group, index) => {
        group.materialIndex = index % PARTS_PER_CAR < 2 ? 0 : 1
    })
    geometry.computeVertexNormals()
    geometry.computeBoundingBox()
    return geometry
}

// Each car is merged before it reaches Three's renderer. There are no
// independently-rendered, near-coplanar meshes that can z-fight in motion.
export function createTrainCarGeometry(dimensions = TRAIN_CAR_DIMENSIONS) {
    return mergeTrainParts(createTrainCarParts(dimensions))
}

export function createTrainSetGeometry({ carCount = TRAIN_CAR_COUNT, dimensions = TRAIN_CAR_DIMENSIONS } = {}) {
    const parts = []
    const spacing = dimensions.length + TRAIN_CAR_GAP_METERS
    const startOffset = -((carCount - 1) * spacing) / 2

    for (let index = 0; index < carCount; index += 1) {
        const offset = startOffset + index * spacing
        const carParts = createTrainCarParts(dimensions)
        carParts.forEach(part => {
            part.translate(0, offset, 0)
            parts.push(part)
        })
    }

    return mergeTrainParts(parts)
}

export function createTrainCarMaterials(lineColor) {
    return [
        new THREE.MeshStandardMaterial({ color: lineColor, roughness: 0.62, metalness: 0.08 }),
        new THREE.MeshStandardMaterial({ color: '#17212b', roughness: 0.28, metalness: 0.32 }),
    ]
}