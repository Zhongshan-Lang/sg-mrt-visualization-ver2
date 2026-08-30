import maplibregl from 'maplibre-gl'
import * as turf from '@turf/turf'

import { computeTrainHeading } from './trainHeading'
import { buildTrainRouteNetwork, findNearestStationCode } from './trainRouteGeometry'
import { TrainTrackingCamera } from './trainTrackingCamera'
import { buildTrainPanelData } from './trainPanelData'
import { buildStationArrivals } from './trainArrivals'
import { bindTrainMarkerEvents, getInitialStationIndex, getInitialTrainCoord } from './trainCreation'
import { createTrainMarkerDom } from './trainMarkerDom'
import { advanceTrainTowardStation, ensureCurrentStationIndex, getTargetStationIndex, normalizeLoopState, updateWaitTimer } from './trainMotion'
import { buildTrainPopupHTML } from './trainPopup'
import { createTrainSelectionController } from './trainSelectionController'
import { LRT_LOOP_LINES, LRT_LINES } from '../../routing/specialLineRules'

// 娣诲姞棰滆壊鏄犲皠
const routeColors = {
    'NS': '#d42e12',
    'EW_MAIN': '#009645',
    'EW_CG': '#009645',
    'NE': '#9900aa',
    'CC_MAIN': '#fa9e0d',
    'CC_CE': '#fa9e0d',
    'DT': '#005ec4',
    'TE': '#9D5B25',
    'CG': '#009645',
    'CE': '#fa9e0d',
    'BP': '#808080',
    'PE': '#808080',
    'PW': '#808080',
    'SE': '#808080',
    'SW': '#808080',
}

function getRouteKeyFromTrainId(trainId) {
    return trainId.replace(/_\d+_r$/, '').replace(/_\d+$/, '')
}

export class TrainSystem {

    constructor(map, geojson) {
        window.__trainSystem = this
        this.map = map
        this.geojson = geojson
        this.trains = []
        this.animationFrame = null
        this.speedMultiplier = 1
        this.onTrainSelect = null // callback(trainData) when train clicked

        this.trackingCamera = new TrainTrackingCamera(map, train => this._computeHeading(train))
        this.selectionController = createTrainSelectionController({
            map: this.map,
            trackingCamera: this.trackingCamera,
            buildPanelData: train => this._buildPanelData(train),
            getOnTrainSelect: () => this.onTrainSelect,
            startTracking: (train, el) => this._startTracking(train, el),
            stopTracking: () => this._stopTracking(),
        })
        this.selectionController.ensureMapClickBinding()

        const network = buildTrainRouteNetwork(this.geojson)
        this.lineFeatures = network.lineFeatures
        this.routes = network.routes
        this.routeStations = network.routeStations
        this.stationCoords = network.stationCoords

        this.createInitialTrains()

        this.lastTime = performance.now()
    }

    findNearestStation(coords, threshold = 0.002) {
        return findNearestStationCode(this.stationCoords, coords, threshold)
    }

    createInitialTrains() {
        const trainCounts = {
            NS: 8, EW_MAIN: 6, EW_CG: 6, NE: 5, CC_MAIN: 5, CC_CE: 5,
            DT: 8, TE: 7, BP: 4, SE: 2, SW: 2, PE: 2, PW: 2,
            CG: 1, CE: 1
        }
        // 鏀嚎鍋忕Щ閲忥細閲嶅悎娈典富鏀嚎浜ら敊鍒嗗竷
        const branchOffset = { EW_CG: 0.5, CC_CE: 0.5 }

        Object.keys(this.routes).forEach(routeName => {
            const count = trainCounts[routeName] || 2
            const isLoop = LRT_LOOP_LINES.includes(routeName)
            // 鐜嚎 & 闈炶交杞ㄧ嚎鍙屽悜杩愯
            const dirs = isLoop || !LRT_LINES.includes(routeName) ? [1, -1] : [1]
            const phase = branchOffset[routeName] || 0  // 鏀嚎鍋忕Щ鍗婇棿璺?

            for (let i = 0; i < count; i++) {
                dirs.forEach(dir => {
                    const suffix = dir === -1 ? '_r' : ''
                    this.createTrain({
                        id: `${routeName}_${i}${suffix}`,
                        route: this.routes[routeName],
                        distance: (this.routes[routeName].length / count) * (i + phase) + Math.random() * 0.2,
                        speed: 0,
                        direction: dir,
                        waitTimer: Math.random() * 2,
                        currentStationIndex: 0,
                        targetSpeed: 0.01 + Math.random() * 0.003,
                        _braking: false
                    })
                })
            }
        })
    }





    createTrain(config) {
        const routeKey = getRouteKeyFromTrainId(config.id)
        const feature = config.route.feature
        const color = routeColors[routeKey] || '#ffffff'
        const trainIndex = this.trains.length
        const { el, bodyEl, syncMarkerSize } = createTrainMarkerDom({ color, trainIndex })

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })

        const syncHitArea = (train) => {
            if (!train?.marker) return
            syncMarkerSize(train)
        }

        bindTrainMarkerEvents({
            bodyEl,
            getTrain: () => {
                const idx = parseInt(bodyEl.getAttribute('data-train-idx'))
                return this.trains[idx]
            },
            onHoverStart: (train) => {
                if (this._hoverPopup) return
                const trainData = this._buildPanelData(train)
                this._hoverPopup = new maplibregl.Popup({ offset: 12, closeButton: false, closeOnClick: false })
                    .setLngLat(train.marker.getLngLat())
                    .setHTML(buildTrainPopupHTML(trainData, {
                        geojson: this.geojson,
                        routeColors,
                        lineColor: color
                    }))
                    .addTo(this.map)
                const popupEl = this._hoverPopup.getElement()
                if (popupEl) popupEl.style.zIndex = '99'
            },
            onHoverEnd: () => {
                if (this._hoverPopup) {
                    this._hoverPopup.remove()
                    this._hoverPopup = null
                }
            },
            onClick: (train) => {
                this.selectionController.handleMarkerClick(train, el)
            }
        })

        const firstCoord = getInitialTrainCoord(feature)
        if (!firstCoord) return

        marker.setLngLat(firstCoord)
        marker.addTo(this.map)

        const stations = this.routeStations?.[routeKey] || []
        const currentStationIndex = getInitialStationIndex(stations, config.distance, config.direction)

        const train = {
            ...config,
            currentStationIndex,
            marker,
            el,
            routeKey,
            visualColor: color,
            _routeStations: this.routeStations?.[routeKey] || [],
            isTracked: false,
            syncHitArea: () => syncHitArea(train)
        }
        this.trains.push(train)
        syncHitArea(train)
    }

    updateTrain(train, dt) {
        const routeKey = getRouteKeyFromTrainId(train.id)

        const stations =
            this.routeStations?.[routeKey] || []

        if (stations.length < 2) return

        const isLoop = LRT_LOOP_LINES.includes(routeKey)
        normalizeLoopState(train, stations, isLoop)
        ensureCurrentStationIndex(train)
        if (updateWaitTimer(train, dt)) return

        const targetIndex = getTargetStationIndex(train, stations, isLoop)

        const targetStation =
            stations[targetIndex]

        if (!targetStation) return
        const arrived = advanceTrainTowardStation(train, targetStation, dt)
        if (arrived) {
            train.currentStationIndex = targetIndex
            train.waitTimer = 4 + Math.random() * 3
        }

        const routeGeom = train.route.feature.geometry.coordinates
        const point = turf.along(
            turf.lineString(Array.isArray(routeGeom[0][0]) ? routeGeom[0] : routeGeom),
            train.distance
        )
        train.marker.setLngLat(point.geometry.coordinates)
        train.syncHitArea?.()
    }

    setVisible(show) {
        this._visible = show
        this.trains.forEach(t => {
            if (t.el) t.el.style.display = show ? '' : 'none'
        })
    }

    getArrivals(stationCode) {
        return buildStationArrivals({
            stationCode,
            trains: this.trains,
            routeStations: this.routeStations,
            routeColors,
        })
    }

    setSpeed(multiplier) {
        this.speedMultiplier = multiplier
    }

    _buildPanelData(train) {
        return buildTrainPanelData(train)
    }

    setTrackingView(mode) {
        this.trackingCamera.setView(mode)
    }

    _computeHeading(train) {
        return computeTrainHeading(train, this.map.getBearing())
    }

    _startTracking(train, el) {
        this.trackingCamera.start(train, el)
    }

    _stopTracking() {
        this.trackingCamera.stop()
    }

    update() {
        const now = performance.now()
        let dt = (now - this.lastTime) / 1000
        if (isNaN(dt) || dt <= 0) dt = 0.016
        dt = Math.min(dt, 0.1)
        this.lastTime = now
        dt *= this.speedMultiplier
        this.trains.forEach(train => {
            try {
                this.updateTrain(train, dt)
            } catch {
                // Keep the simulation running even if one train frame fails.
            }
        })

        // Refresh panel + keep the tracking camera locked to the selected train.
        if (this.trackingCamera.trackedTrain?.marker) {
            this.selectionController.refreshTrackedPanel(now)
            this.trackingCamera.update(now)
        }

        this.map.triggerRepaint()

        this.animationFrame = requestAnimationFrame(() => this.update())
    }
    start() {
        this.stop()
        this.lastTime = performance.now()
        this.update()
    }

    stop() {
        cancelAnimationFrame(this.animationFrame)
    }
}






