import maplibregl from 'maplibre-gl'
import * as THREE from 'three'

export const TRAIN_3D_LAYER_ID = 'mrt-train-3d'

const MAX_TRAIN_INSTANCES = 192
const TRAIN_WIDTH_METERS = 3.15
const TRAIN_LENGTH_METERS = 32
const TRAIN_HEIGHT_METERS = 3.45
const TRAIN_GROUND_CLEARANCE_METERS = 0.35

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

function createTrainColorMaterial() {
    return new THREE.ShaderMaterial({
        vertexShader: `
            attribute vec3 instanceColor;
            varying vec3 vInstanceColor;

            void main() {
                vInstanceColor = instanceColor;
                gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vInstanceColor;

            void main() {
                gl_FragColor = vec4(pow(vInstanceColor, vec3(1.0 / 2.2)), 1.0);
            }
        `,
        depthTest: true,
        depthWrite: true,
        toneMapped: false
    })
}

function createTrainMaterials() {
    const glass = new THREE.MeshBasicMaterial({
        color: '#102235',
        toneMapped: false
    })

    return {
        body: createTrainColorMaterial(),
        roof: createTrainColorMaterial(),
        glass
    }
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

            const coordinate = maplibregl.MercatorCoordinate.fromLngLat(lngLat, TRAIN_GROUND_CLEARANCE_METERS)
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
