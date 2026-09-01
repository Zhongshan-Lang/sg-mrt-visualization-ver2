import * as turf from '@turf/turf'

const SOURCE_ID = 'mrt-train-3d-source'
const LAYER_ID = 'mrt-train-3d-body'
const CAR_LENGTH_METERS = 68
const CAR_WIDTH_METERS = 6
const TRAIN_HEIGHT_METERS = 6.5
const TRAIN_BASE_METERS = 0.28
const TRAIN_SIZE_SCALE_STOPS = [[11, 5], [15, 2], [19, 1.05]]

function findBuildingBeforeId(map) {
    return map.getStyle()?.layers?.find(layer => layer.id !== LAYER_ID && layer.type === 'fill-extrusion')?.id
}

export function moveNativeTrainLayerAboveNetwork(map) {
    const buildingLayerId = findBuildingBeforeId(map)
    if (buildingLayerId && map.getLayer(LAYER_ID)) {
        map.moveLayer(LAYER_ID, buildingLayerId)
    }
}

export function getNativeTrainSizeScale(zoom) {
    const safeZoom = Number.isFinite(zoom) ? zoom : 15
    if (safeZoom <= TRAIN_SIZE_SCALE_STOPS[0][0]) return TRAIN_SIZE_SCALE_STOPS[0][1]
    const lastStop = TRAIN_SIZE_SCALE_STOPS.at(-1)
    if (safeZoom >= lastStop[0]) return lastStop[1]

    for (let index = 1; index < TRAIN_SIZE_SCALE_STOPS.length; index += 1) {
        const [nextZoom, nextScale] = TRAIN_SIZE_SCALE_STOPS[index]
        const [previousZoom, previousScale] = TRAIN_SIZE_SCALE_STOPS[index - 1]
        if (safeZoom <= nextZoom) {
            const progress = (safeZoom - previousZoom) / (nextZoom - previousZoom)
            return previousScale + ((nextScale - previousScale) * progress)
        }
    }

    return lastStop[1]
}

function offsetCoordinate(center, distanceMeters, bearing) {
    return turf.destination(center, distanceMeters / 1000, bearing, { units: 'kilometers' }).geometry.coordinates
}

function createCarPolygon(center, heading, sizeScale) {
    const carLength = CAR_LENGTH_METERS * sizeScale
    const carWidth = CAR_WIDTH_METERS * sizeScale
    const front = offsetCoordinate(center, carLength / 2, heading)
    const back = offsetCoordinate(center, carLength / 2, heading + 180)
    const frontRight = offsetCoordinate(front, carWidth / 2, heading + 90)
    const frontLeft = offsetCoordinate(front, carWidth / 2, heading - 90)
    const backRight = offsetCoordinate(back, carWidth / 2, heading + 90)
    const backLeft = offsetCoordinate(back, carWidth / 2, heading - 90)

    return [frontRight, backRight, backLeft, frontLeft, frontRight]
}

export function getTrainForNativeFeature(trains, feature) {
    const trainId = feature?.properties?.trainId
    return trains.find(train => train.id === trainId) || null
}

export function createNativeTrainFeatures(trains, getHeading, sizeScale = 1) {
    return trains.flatMap(train => {
        if (!train?.marker) return []

        const center = train.marker.getLngLat().toArray()
        const heading = getHeading(train)

        return [turf.polygon([createCarPolygon(center, heading, sizeScale)], {
            trainId: train.id,
            color: train.visualColor,
            height: TRAIN_HEIGHT_METERS * sizeScale,
            base: TRAIN_BASE_METERS,
        })]
    })
}

export class NativeTrain3dLayer {
    constructor(map, trains, getHeading, callbacks = {}) {
        this.map = map
        this.getHeading = getHeading
        this.markerOpacities = new Map(trains.map(train => [train, train.el?.style.opacity ?? '']))
        this.trains = trains
        this.onZoom = () => this.sync(this.trains)
        this.onMouseEnter = event => {
            const train = getTrainForNativeFeature(this.trains, event.features?.[0])
            if (!train) return
            this.map.getCanvas().style.cursor = 'pointer'
            callbacks.onHoverStart?.(train)
        }
        this.onMouseLeave = () => {
            this.map.getCanvas().style.cursor = ''
            callbacks.onHoverEnd?.()
        }
        this.onClick = event => {
            const train = getTrainForNativeFeature(this.trains, event.features?.[0])
            if (train) callbacks.onClick?.(train)
        }

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
        map.on('zoom', this.onZoom)
        map.on('mouseenter', LAYER_ID, this.onMouseEnter)
        map.on('mouseleave', LAYER_ID, this.onMouseLeave)
        map.on('click', LAYER_ID, this.onClick)

        trains.forEach(train => {
            if (train.el) train.el.style.opacity = '0'
        })
        this.sync(trains)
    }

    sync(trains) {
        this.trains = trains
        const source = this.map?.getSource(SOURCE_ID)
        const sizeScale = getNativeTrainSizeScale(this.map?.getZoom?.())
        source?.setData(turf.featureCollection(createNativeTrainFeatures(trains, this.getHeading, sizeScale)))
    }

    setVisible(visible) {
        if (this.map?.getLayer(LAYER_ID)) {
            this.map.setLayoutProperty(LAYER_ID, 'visibility', visible ? 'visible' : 'none')
        }
    }

    destroy() {
        this.map?.off('zoom', this.onZoom)
        this.map?.off('mouseenter', LAYER_ID, this.onMouseEnter)
        this.map?.off('mouseleave', LAYER_ID, this.onMouseLeave)
        this.map?.off('click', LAYER_ID, this.onClick)
        this.markerOpacities?.forEach((opacity, train) => {
            if (train.el) train.el.style.opacity = opacity
        })
        if (this.map?.getLayer(LAYER_ID)) this.map.removeLayer(LAYER_ID)
        if (this.map?.getSource(SOURCE_ID)) this.map.removeSource(SOURCE_ID)
        this.map = null
    }
}