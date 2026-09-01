import * as turf from '@turf/turf'

const SOURCE_ID = 'mrt-train-3d-source'
const LAYER_ID = 'mrt-train-3d-body'
const CAR_LENGTH_METERS = 68
const CAR_WIDTH_METERS = 6
const TRAIN_HEIGHT_METERS = 6.5
const TRAIN_BASE_METERS = 0.28

function findBuildingBeforeId(map) {
    return map.getStyle()?.layers?.find(layer => layer.type === 'fill-extrusion')?.id
}

export function moveNativeTrainLayerAboveNetwork(map) {
    const buildingLayerId = findBuildingBeforeId(map)
    if (buildingLayerId && map.getLayer(LAYER_ID)) {
        map.moveLayer(LAYER_ID, buildingLayerId)
    }
}

function offsetCoordinate(center, distanceMeters, bearing) {
    return turf.destination(center, distanceMeters / 1000, bearing, { units: 'kilometers' }).geometry.coordinates
}

function createCarPolygon(center, heading) {
    const front = offsetCoordinate(center, CAR_LENGTH_METERS / 2, heading)
    const back = offsetCoordinate(center, CAR_LENGTH_METERS / 2, heading + 180)
    const frontRight = offsetCoordinate(front, CAR_WIDTH_METERS / 2, heading + 90)
    const frontLeft = offsetCoordinate(front, CAR_WIDTH_METERS / 2, heading - 90)
    const backRight = offsetCoordinate(back, CAR_WIDTH_METERS / 2, heading + 90)
    const backLeft = offsetCoordinate(back, CAR_WIDTH_METERS / 2, heading - 90)

    return [frontRight, backRight, backLeft, frontLeft, frontRight]
}

export function createNativeTrainFeatures(trains, getHeading) {
    return trains.flatMap(train => {
        if (!train?.marker) return []

        const center = train.marker.getLngLat().toArray()
        const heading = getHeading(train)

        return [turf.polygon([createCarPolygon(center, heading)], {
            color: train.visualColor,
            height: TRAIN_HEIGHT_METERS,
            base: TRAIN_BASE_METERS,
        })]
    })
}

export class NativeTrain3dLayer {
    constructor(map, trains, getHeading) {
        this.map = map
        this.getHeading = getHeading
        this.markerOpacities = new Map(trains.map(train => [train, train.el?.style.opacity ?? '']))

        map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: turf.featureCollection([]),
        })
        map.addLayer({
            id: LAYER_ID,
            type: 'fill-extrusion',
            source: SOURCE_ID,
            paint: {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'base'],
                'fill-extrusion-opacity': 1,
                'fill-extrusion-vertical-gradient': true,
            },
        }, findBuildingBeforeId(map))
        queueMicrotask(() => moveNativeTrainLayerAboveNetwork(map))

        trains.forEach(train => {
            if (train.el) train.el.style.opacity = '0'
        })
        this.sync(trains)
    }

    sync(trains) {
        const source = this.map?.getSource(SOURCE_ID)
        source?.setData(turf.featureCollection(createNativeTrainFeatures(trains, this.getHeading)))
    }

    setVisible(visible) {
        if (this.map?.getLayer(LAYER_ID)) {
            this.map.setLayoutProperty(LAYER_ID, 'visibility', visible ? 'visible' : 'none')
        }
    }

    destroy() {
        this.markerOpacities?.forEach((opacity, train) => {
            if (train.el) train.el.style.opacity = opacity
        })
        if (this.map?.getLayer(LAYER_ID)) this.map.removeLayer(LAYER_ID)
        if (this.map?.getSource(SOURCE_ID)) this.map.removeSource(SOURCE_ID)
        this.map = null
    }
}