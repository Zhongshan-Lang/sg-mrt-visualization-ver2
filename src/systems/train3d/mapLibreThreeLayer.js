import maplibregl from 'maplibre-gl'
import * as THREE from 'three'

const SQRT3 = Math.sqrt(3)

export function getMainProjectionMatrix(renderData) {
    if (Array.isArray(renderData) || ArrayBuffer.isView(renderData)) {
        return renderData
    }

    const matrix = renderData?.defaultProjectionData?.mainMatrix ?? renderData?.mainMatrix
    if (!matrix) {
        throw new Error('MapLibre custom layer did not provide a projection matrix')
    }
    return matrix
}

export function getLocalMercatorPosition(origin, coordinate) {
    return new THREE.Vector3(
        coordinate.x - origin.x,
        origin.y - coordinate.y,
        coordinate.z
    )
}

// This camera path follows mini-tokyo-3d's custom Three layer. In particular,
// the view matrix is assigned directly, which keeps MapLibre's scale component
// intact on current Three.js versions.
export class MapLibreThreeLayer {
    constructor({ id, beforeId, minzoom = 0, maxzoom = 24 }) {
        this.id = id
        this.beforeId = beforeId
        this.minzoom = minzoom
        this.maxzoom = maxzoom
        this.scene = new THREE.Scene()
        this.camera = new THREE.PerspectiveCamera()
        this.camera.matrixWorldAutoUpdate = false
    }

    add(map) {
        map.addLayer({
            id: this.id,
            type: 'custom',
            renderingMode: '3d',
            onAdd: (mbox, gl) => this.onAdd(mbox, gl),
            render: (gl, matrix) => this.render(gl, matrix),
            onRemove: () => this.destroy(),
        }, this.beforeId)
        map.setLayerZoomRange(this.id, this.minzoom, this.maxzoom)
    }

    onAdd(map, gl) {
        this.map = map
        this.modelOrigin = maplibregl.MercatorCoordinate.fromLngLat(map.getCenter(), 0)
        this.renderer = new THREE.WebGLRenderer({ canvas: map.getCanvas(), context: gl })
        this.renderer.autoClear = false

        this.directionalLight = new THREE.DirectionalLight('#ffffff', 3.8)
        this.ambientLight = new THREE.AmbientLight('#ffffff', 0.4)
        this.scene.add(this.directionalLight, this.ambientLight)
        // A scene containing no mesh can leave a shared MapLibre canvas black.
        this.scene.add(new THREE.Mesh())
    }

    render(_gl, matrix) {
        const { transform } = this.map
        const { _fov, _camera, _horizonShift, pixelsPerMeter, worldSize, _pitch, width, height } = transform
        const halfFov = _fov / 2
        const cameraToSeaLevelDistance = _camera.position[2] * worldSize / Math.cos(_pitch)
        const horizonDistance = cameraToSeaLevelDistance / _horizonShift
        const undergroundDistance = 1000 * pixelsPerMeter / Math.cos(_pitch)
        const far = Math.max(horizonDistance, cameraToSeaLevelDistance + undergroundDistance)
        const near = height / 50
        const halfHeight = Math.tan(halfFov) * near
        const halfWidth = halfHeight * width / height

        this.camera.near = near
        this.camera.far = far
        this.camera.projectionMatrix.makePerspective(-halfWidth, halfWidth, halfHeight, -halfHeight, near, far)
        this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert()

        const mapMatrix = new THREE.Matrix4().fromArray(getMainProjectionMatrix(matrix))
        const localTransform = new THREE.Matrix4()
            .makeTranslation(this.modelOrigin.x, this.modelOrigin.y, 0)
            .scale(new THREE.Vector3(1, -1, 1))

        this.camera.matrixWorldInverse
            .copy(this.camera.projectionMatrixInverse)
            .multiply(mapMatrix)
            .multiply(localTransform)
        this.camera.matrixWorld.copy(this.camera.matrixWorldInverse).invert()

        const lightBearing = THREE.MathUtils.degToRad(this.map.getBearing() + 30)
        this.directionalLight.position.set(-Math.sin(lightBearing), -Math.cos(lightBearing), SQRT3).normalize()

        this.renderer.resetState()
        this.renderer.render(this.scene, this.camera)
    }

    setCarPose(mesh, { lngLat, altitude = 0, heading = 0 }) {
        const coordinate = maplibregl.MercatorCoordinate.fromLngLat(lngLat, altitude)
        mesh.position.copy(getLocalMercatorPosition(this.modelOrigin, coordinate))
        const meterScale = coordinate.meterInMercatorCoordinateUnits()
        mesh.scale.setScalar(meterScale)
        mesh.rotation.set(0, 0, -THREE.MathUtils.degToRad(heading))
    }

    destroy() {
        this.renderer?.dispose()
        this.scene.clear()
        this.renderer = null
        this.map = null
    }
}
