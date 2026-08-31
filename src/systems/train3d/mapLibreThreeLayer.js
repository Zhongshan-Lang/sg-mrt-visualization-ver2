import maplibregl from 'maplibre-gl'
import * as THREE from 'three'

const SQRT3 = Math.sqrt(3)

export function getProjectionMatrix(renderData) {
    if (Array.isArray(renderData) || ArrayBuffer.isView(renderData)) {
        return renderData
    }

    const matrix = renderData?.defaultProjectionData?.mainMatrix ?? renderData?.modelViewProjectionMatrix ?? renderData?.projectionMatrix
    if (!matrix) {
        throw new Error('MapLibre custom layer did not provide a projection matrix')
    }
    return matrix
}

export function getTrainMeshTransform(meterScale, heading) {
    return {
        scale: [meterScale, meterScale, meterScale],
        rotationZ: Math.PI + THREE.MathUtils.degToRad(heading),
    }
}
export function getLocalMercatorPosition(origin, coordinate) {
    return new THREE.Vector3(
        coordinate.x - origin.x,
        origin.y - coordinate.y,
        coordinate.z
    )
}

// MapLibre 5 supplies a projection matrix for a mercator custom layer. Keep
// mesh coordinates in that world space instead of reconstructing a private map
// camera transform; this is the supported path for depth-aware 3D custom layers.
export class MapLibreThreeLayer {
    constructor({ id, beforeId, minzoom = 0, maxzoom = 24 }) {
        this.id = id
        this.beforeId = beforeId
        this.minzoom = minzoom
        this.maxzoom = maxzoom
        this.scene = new THREE.Scene()
        this.camera = new THREE.Camera()
        this.camera.matrixWorldAutoUpdate = false
    }

    add(map) {
        map.addLayer({
            id: this.id,
            type: 'custom',
            renderingMode: '3d',
            onAdd: (mbox, gl) => this.onAdd(mbox, gl),
            render: (gl, renderData) => this.render(gl, renderData),
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

    render(_gl, renderData) {
        this.camera.projectionMatrix.fromArray(getProjectionMatrix(renderData))
        this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert()
        this.camera.matrixWorld.identity()
        this.camera.matrixWorldInverse.identity()

        const lightBearing = THREE.MathUtils.degToRad(this.map.getBearing() + 30)
        this.directionalLight.position.set(-Math.sin(lightBearing), -Math.cos(lightBearing), SQRT3).normalize()

        this.renderer.resetState()
        this.renderer.render(this.scene, this.camera)
    }

    setCarPose(mesh, { lngLat, altitude = 0, heading = 0 }) {
        const coordinate = maplibregl.MercatorCoordinate.fromLngLat(lngLat, altitude)
        const transform = getTrainMeshTransform(
            coordinate.meterInMercatorCoordinateUnits(),
            heading
        )
        mesh.position.set(coordinate.x, coordinate.y, coordinate.z)
        mesh.scale.set(...transform.scale)
        mesh.rotation.set(0, 0, transform.rotationZ)
    }

    destroy() {
        this.renderer?.dispose()
        this.scene.clear()
        this.renderer = null
        this.map = null
    }
}