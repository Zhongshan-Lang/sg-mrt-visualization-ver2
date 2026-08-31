import maplibregl from 'maplibre-gl'
import * as THREE from 'three'

export const TRAIN_3D_LAYER_ID = 'mrt-train-3d'

const MAX_TRAIN_INSTANCES = 192
const TRAIN_WIDTH_METERS = 3.15
const TRAIN_LENGTH_METERS = 32
const TRAIN_HEIGHT_METERS = 3.45

function createInstancedMesh(geometry, material) {
    const mesh = new THREE.InstancedMesh(geometry, material, MAX_TRAIN_INSTANCES)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    mesh.frustumCulled = false
    return mesh
}

function createTrainGeometry() {
    const body = new THREE.BoxGeometry(TRAIN_WIDTH_METERS, TRAIN_LENGTH_METERS, TRAIN_HEIGHT_METERS)
        .translate(0, 0, TRAIN_HEIGHT_METERS / 2)
    const roof = new THREE.BoxGeometry(TRAIN_WIDTH_METERS - 0.26, TRAIN_LENGTH_METERS - 2.4, 0.28)
        .translate(0, 0, TRAIN_HEIGHT_METERS + 0.12)
    const leftWindows = new THREE.BoxGeometry(0.1, TRAIN_LENGTH_METERS - 5.8, 1.05)
        .translate(-(TRAIN_WIDTH_METERS / 2 + 0.03), 0.25, TRAIN_HEIGHT_METERS * 0.61)
    const rightWindows = new THREE.BoxGeometry(0.1, TRAIN_LENGTH_METERS - 5.8, 1.05)
        .translate(TRAIN_WIDTH_METERS / 2 + 0.03, 0.25, TRAIN_HEIGHT_METERS * 0.61)
    const frontWindow = new THREE.BoxGeometry(TRAIN_WIDTH_METERS - 0.3, 0.14, 1.35)
        .translate(0, -(TRAIN_LENGTH_METERS / 2 + 0.04), TRAIN_HEIGHT_METERS * 0.64)

    return { body, roof, leftWindows, rightWindows, frontWindow }
}

function createTrainMaterials() {
    const body = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        vertexColors: true,
        metalness: 0.22,
        roughness: 0.52
    })
    const roof = new THREE.MeshStandardMaterial({
        color: '#ffffff',
        vertexColors: true,
        metalness: 0.18,
        roughness: 0.4
    })
    const glass = new THREE.MeshStandardMaterial({
        color: '#102235',
        metalness: 0.5,
        roughness: 0.2
    })

    return { body, roof, glass }
}

export function trainHeadingToModelYaw(heading) {
    return THREE.MathUtils.degToRad(heading)
}

export class Train3DLayer {
    constructor(map) {
        this.id = TRAIN_3D_LAYER_ID
        this.type = 'custom'
        this.renderingMode = '3d'
        this.map = map
        this.trains = []
        this.visible = true
        this.added = false
        this.group = null
        this.renderer = null
        this.scene = null
        this.camera = null
        this.meshes = null
        this._position = new THREE.Vector3()
        this._scale = new THREE.Vector3()
        this._rotation = new THREE.Quaternion()
        this._matrix = new THREE.Matrix4()
        this._color = new THREE.Color()
        this._roofColor = new THREE.Color()
    }

    add(beforeId) {
        if (this.map.getLayer(this.id)) return
        this.map.addLayer(this, beforeId)
    }

    onAdd(map, gl) {
        this.camera = new THREE.Camera()
        this.scene = new THREE.Scene()
        this.group = new THREE.Group()
        this.scene.add(this.group)

        const { body, roof, leftWindows, rightWindows, frontWindow } = createTrainGeometry()
        const { body: bodyMaterial, roof: roofMaterial, glass } = createTrainMaterials()
        this.meshes = {
            body: createInstancedMesh(body, bodyMaterial),
            roof: createInstancedMesh(roof, roofMaterial),
            leftWindows: createInstancedMesh(leftWindows, glass),
            rightWindows: createInstancedMesh(rightWindows, glass),
            frontWindow: createInstancedMesh(frontWindow, glass)
        }
        Object.values(this.meshes).forEach(mesh => this.group.add(mesh))

        this.scene.add(new THREE.HemisphereLight('#f4f9ff', '#263342', 2.4))
        const keyLight = new THREE.DirectionalLight('#ffffff', 2.1)
        keyLight.position.set(-1, -1, 2)
        this.scene.add(keyLight)

        this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: false,
            alpha: true
        })
        this.renderer.autoClear = false
        this.sync(this.trains)
    }

    onRemove() {
        if (this.renderer) this.renderer.dispose()
        if (this.meshes) {
            Object.values(this.meshes).forEach(mesh => {
                mesh.geometry.dispose()
                mesh.material.dispose()
            })
        }
        this.renderer = null
        this.scene = null
        this.camera = null
        this.group = null
        this.meshes = null
        this.added = false
    }

    setVisible(visible) {
        this.visible = visible
        if (this.group) this.group.visible = visible
        this.map.triggerRepaint?.()
    }

    sync(trains) {
        this.trains = trains || []
        if (!this.meshes || !this.group) return

        const count = Math.min(this.trains.length, MAX_TRAIN_INSTANCES)
        Object.values(this.meshes).forEach(mesh => { mesh.count = count })

        for (let index = 0; index < count; index += 1) {
            const train = this.trains[index]
            const lngLat = train?.marker?.getLngLat?.()
            if (!lngLat) continue

            const coordinate = maplibregl.MercatorCoordinate.fromLngLat(lngLat, 0)
            const scale = coordinate.meterInMercatorCoordinateUnits() * (train.isTracked ? 1.12 : 1)
            const heading = train.heading || 0

            this._position.set(coordinate.x, coordinate.y, coordinate.z)
            this._scale.set(scale, scale, scale)
            this._rotation.setFromAxisAngle(new THREE.Vector3(0, 0, 1), trainHeadingToModelYaw(heading || 0))
            this._matrix.compose(this._position, this._rotation, this._scale)

            this.meshes.body.setMatrixAt(index, this._matrix)
            this.meshes.roof.setMatrixAt(index, this._matrix)
            this.meshes.leftWindows.setMatrixAt(index, this._matrix)
            this.meshes.rightWindows.setMatrixAt(index, this._matrix)
            this.meshes.frontWindow.setMatrixAt(index, this._matrix)

            this._color.set(train.visualColor || '#ffffff')
            this.meshes.body.setColorAt(index, this._color)
            this._roofColor.copy(this._color).lerp(new THREE.Color('#ffffff'), 0.24)
            this.meshes.roof.setColorAt(index, this._roofColor)
        }

        Object.values(this.meshes).forEach(mesh => {
            mesh.instanceMatrix.needsUpdate = true
            if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
        })
        this.group.visible = this.visible && count > 0
    }

    render(gl, { defaultProjectionData }) {
        if (!this.renderer || !this.camera || !this.scene || !this.visible) return

        const matrix = defaultProjectionData?.mainMatrix
        if (!matrix) return

        this.camera.projectionMatrix.fromArray(matrix)
        this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert()
        this.renderer.resetState()
        this.renderer.render(this.scene, this.camera)
    }
}
