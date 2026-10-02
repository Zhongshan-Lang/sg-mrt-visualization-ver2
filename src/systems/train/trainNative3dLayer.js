import * as turf from '@turf/turf'

const SOURCE_ID = 'mrt-train-3d-source'
const LAYER_ID = 'mrt-train-3d-body'
const CAR_LENGTH_METERS = 20
const CAR_WIDTH_METERS = 8
const TRAIN_HEIGHT_METERS = 6.5
const TRAIN_BASE_METERS = 0.28
const TRAIN_SIZE_SCALE_STOPS = [[11, 30], [15, 5], [19, 1.05]]

function findBuildingBeforeId(map) {
    return map.getStyle()?.layers?.find(layer => layer.id !== LAYER_ID && layer.type === 'fill-extrusion')?.id
}

export function moveNativeTrainLayerAboveNetwork(map) {
    const buildingLayerId = findBuildingBeforeId(map)
    if (!buildingLayerId) return

    const layerIds = [HIGHLIGHT_FILL_LAYER_ID, HIGHLIGHT_GLOW_LAYER_ID, LAYER_ID]
    layerIds.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.moveLayer(layerId, buildingLayerId)
        }
    })
}

const HIGHLIGHT_FILL_LAYER_ID = 'mrt-train-3d-selection-base'
const HIGHLIGHT_GLOW_LAYER_ID = 'mrt-train-3d-selection-glow'
const SELECTED_AURA_SCALE = 1.16

const PULSE_DURATION_MS = 1800
const PULSE_UPDATE_INTERVAL_MS = 80
export function getSelectedTrainPulse(timestamp) {
    return (Math.sin((timestamp / PULSE_DURATION_MS) * Math.PI * 2) + 1) / 2
}

export function getSelectedTrainGlowColor(theme) {
    const currentTheme = theme ?? (typeof localStorage === 'undefined' ? 'light' : localStorage.getItem('mrt-theme'))
    return currentTheme === 'dark' ? '#ffd65e' : '#005ec4'
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

export function createNativeTrainFeatures(trains, getHeading, sizeScale = 1, selectedTrainId = null) {
    return trains.flatMap(train => {
        if (!train?.marker) return []

        const center = train.marker.getLngLat().toArray()
        const heading = getHeading(train)
        const body = turf.polygon([createCarPolygon(center, heading, sizeScale)], {
            trainId: train.id,
            color: train.visualColor,
            height: TRAIN_HEIGHT_METERS * sizeScale,
            base: TRAIN_BASE_METERS,
        })

        if (train.id !== selectedTrainId) return [body]

        const auraRing = createCarPolygon(center, heading, sizeScale * SELECTED_AURA_SCALE)
        const auraBase = turf.polygon([auraRing], {
            trainId: train.id,
            color: getSelectedTrainGlowColor(),
            isHighlight: true,
            highlightKind: 'base',
        })
        const auraGlow = turf.lineString(auraRing, {
            trainId: train.id,
            color: getSelectedTrainGlowColor(),
            isHighlight: true,
            highlightKind: 'glow',
        })
        return [auraBase, auraGlow, body]
    })
}

export class NativeTrain3dLayer {
    constructor(map, trains, getHeading, callbacks = {}) {
        this.map = map
        this.getHeading = getHeading
        this.markerStyles = new Map(trains.map(train => [train, {
            opacity: train.el?.style.opacity ?? '',
            pointerEvents: train.el?.style.pointerEvents ?? '',
        }]))
        this.trains = trains
        this.selectedTrainId = null
        this.visible = true
        this.pulseFrame = null
        this.lastPulseUpdate = 0
        this.onPulse = timestamp => this._pulse(timestamp)
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
            filter: ['!=', ['get', 'isHighlight'], true],
            paint: {
                'fill-extrusion-color': ['get', 'color'],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'base'],
                'fill-extrusion-opacity': 1,
                'fill-extrusion-vertical-gradient': true,
            },
        }, findBuildingBeforeId(map))
        map.addLayer({
            id: HIGHLIGHT_FILL_LAYER_ID,
            type: 'fill',
            source: SOURCE_ID,
            filter: ['==', ['get', 'highlightKind'], 'base'],
            paint: {
                'fill-color': ['get', 'color'],
                'fill-opacity': 0.22,
            },
        }, LAYER_ID)
        map.addLayer({
            id: HIGHLIGHT_GLOW_LAYER_ID,
            type: 'line',
            source: SOURCE_ID,
            filter: ['==', ['get', 'highlightKind'], 'glow'],
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': ['get', 'color'],
                'line-width': ['interpolate', ['linear'], ['zoom'], 11, 12, 15, 20, 19, 30],
                'line-opacity': 0.46,
                'line-blur': 8.5,
            },
        }, LAYER_ID)
        queueMicrotask(() => moveNativeTrainLayerAboveNetwork(map))
        map.on('zoom', this.onZoom)
        map.on('mouseenter', LAYER_ID, this.onMouseEnter)
        map.on('mouseleave', LAYER_ID, this.onMouseLeave)
        map.on('click', LAYER_ID, this.onClick)

        trains.forEach(train => {
            if (!train.el) return
            train.el.style.opacity = '0'
            train.el.style.pointerEvents = 'none'
        })
        this.sync(trains)
    }

    _applyPulse(pulse) {
        if (!this.map?.setPaintProperty) return

        if (this.map.getLayer(HIGHLIGHT_FILL_LAYER_ID)) {
            this.map.setPaintProperty(HIGHLIGHT_FILL_LAYER_ID, 'fill-opacity', 0.22 + (pulse * 0.32))
        }
        if (this.map.getLayer(HIGHLIGHT_GLOW_LAYER_ID)) {
            this.map.setPaintProperty(HIGHLIGHT_GLOW_LAYER_ID, 'line-opacity', 0.46 + (pulse * 0.42))
            this.map.setPaintProperty(HIGHLIGHT_GLOW_LAYER_ID, 'line-blur', 8.5 + (pulse * 5.5))
        }
    }
    _pulse(timestamp) {
        if (!this.selectedTrainId || !this.visible || !this.map) {
            this.pulseFrame = null
            return
        }

        if (timestamp - this.lastPulseUpdate >= PULSE_UPDATE_INTERVAL_MS) {
            this.lastPulseUpdate = timestamp
            this._applyPulse(getSelectedTrainPulse(timestamp))
        }
        this.pulseFrame = requestAnimationFrame(this.onPulse)
    }

    _startPulse() {
        if (this.pulseFrame !== null || !this.selectedTrainId || !this.visible) return
        this.lastPulseUpdate = 0
        this.pulseFrame = requestAnimationFrame(this.onPulse)
    }

    _stopPulse() {
        if (this.pulseFrame !== null) cancelAnimationFrame(this.pulseFrame)
        this.pulseFrame = null
        this.lastPulseUpdate = 0
        this._applyPulse(0)
    }

    sync(trains) {
        this.trains = trains
        const source = this.map?.getSource(SOURCE_ID)
        const sizeScale = getNativeTrainSizeScale(this.map?.getZoom?.())
        source?.setData(turf.featureCollection(
            createNativeTrainFeatures(trains, this.getHeading, sizeScale, this.selectedTrainId)
        ))
    }

    setSelectedTrain(train) {
        const selectedTrainId = train?.id ?? null
        if (this.selectedTrainId === selectedTrainId) return
        this.selectedTrainId = selectedTrainId
        this.sync(this.trains)
        if (selectedTrainId) this._startPulse()
        else this._stopPulse()
    }

    setVisible(visible) {
        this.visible = visible
        const visibility = visible ? 'visible' : 'none'
        const layerIds = [HIGHLIGHT_FILL_LAYER_ID, HIGHLIGHT_GLOW_LAYER_ID, LAYER_ID]
        layerIds.forEach(layerId => {
            if (this.map?.getLayer(layerId)) {
                this.map.setLayoutProperty(layerId, 'visibility', visibility)
            }
        })
        if (visible) this._startPulse()
        else this._stopPulse()
    }

    destroy() {
        this._stopPulse()
        this.map?.off('zoom', this.onZoom)
        this.map?.off('mouseenter', LAYER_ID, this.onMouseEnter)
        this.map?.off('mouseleave', LAYER_ID, this.onMouseLeave)
        this.map?.off('click', LAYER_ID, this.onClick)
        this.markerStyles?.forEach((styles, train) => {
            if (!train.el) return
            train.el.style.opacity = styles.opacity
            train.el.style.pointerEvents = styles.pointerEvents
        })
        if (this.map?.getLayer(LAYER_ID)) this.map.removeLayer(LAYER_ID)
        if (this.map?.getLayer(HIGHLIGHT_GLOW_LAYER_ID)) this.map.removeLayer(HIGHLIGHT_GLOW_LAYER_ID)
        if (this.map?.getLayer(HIGHLIGHT_FILL_LAYER_ID)) this.map.removeLayer(HIGHLIGHT_FILL_LAYER_ID)
        if (this.map?.getSource(SOURCE_ID)) this.map.removeSource(SOURCE_ID)
        this.map = null
    }
}