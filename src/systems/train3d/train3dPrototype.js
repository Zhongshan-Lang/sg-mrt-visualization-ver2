import * as THREE from 'three'
import { MapLibreThreeLayer } from './mapLibreThreeLayer'
import { createTrainCarGeometry, createTrainCarMaterials } from './trainCarGeometry'

const TRAIN_3D_LAYER_ID = 'mrt-train-3d-prototype'
const TRAIN_GROUND_CLEARANCE_METERS = 0.28

function findBuildingBeforeId(map) {
    return map.getStyle()?.layers?.find(layer => layer.type === 'fill-extrusion')?.id
}

export class Train3dPrototype {
    constructor(map, train) {
        this.map = map
        this.layer = new MapLibreThreeLayer({
            id: TRAIN_3D_LAYER_ID,
            beforeId: findBuildingBeforeId(map),
            minzoom: 13,
        })
        this.layer.add(map)

        this.geometry = createTrainCarGeometry()
        this.materials = createTrainCarMaterials(train.visualColor)
        this.mesh = new THREE.Mesh(this.geometry, this.materials)
        this.mesh.frustumCulled = false
        this.layer.scene.add(this.mesh)
        this.sync(train)
    }

    sync(train) {
        if (!train?.marker || !this.mesh || !this.layer.modelOrigin) return

        const lngLat = train.marker.getLngLat()
        this.layer.setCarPose(this.mesh, {
            lngLat,
            altitude: TRAIN_GROUND_CLEARANCE_METERS,
            heading: train.heading ?? 0,
        })
    }

    setVisible(visible) {
        if (this.mesh) this.mesh.visible = visible
    }

    destroy() {
        this.geometry?.dispose()
        this.materials?.forEach(material => material.dispose())
        if (this.map?.getLayer(TRAIN_3D_LAYER_ID)) {
            this.map.removeLayer(TRAIN_3D_LAYER_ID)
        }
        this.mesh = null
        this.map = null
    }
}