export class TrainTrackingCamera {
    constructor(map, computeHeading) {
        this.map = map
        this.computeHeading = computeHeading

        this.trackedTrain = null
        this.trackedEl = null
        this.heading = 0
        this.view = 'bird'
        this.flyEnd = 0
        this.wheelActive = false
        this.wheelWasActive = false
        this.wheelBound = false
        this.mapLocked = false
    }

    isTrackingTrain(train) {
        return this.trackedTrain === train
    }

    setView(mode) {
        this.view = mode
        this.flyEnd = performance.now() + 600
        this.map.easeTo({
            pitch: this.getPitch(),
            bearing: this.getBearing(),
            duration: 500
        })
    }

    start(train, el) {
        this.resetMarker()
        this.trackedTrain = train
        this.trackedEl = el
        this.applyTrackedMarker()

        this.view = 'bird'
        this.heading = this.computeHeading(train)
        this.flyEnd = performance.now() + 1400

        this.lockMap()
        this.map.setPitch(0)
        this.map.flyTo({
            center: train.marker.getLngLat(),
            zoom: 16,
            bearing: this.getBearing(),
            duration: 1200,
            essential: true
        })
    }

    stop() {
        this.resetMarker()
        this.trackedTrain = null
        this.flyEnd = 0
        this.unlockMap()
    }

    update(now) {
        const train = this.trackedTrain
        if (!train?.marker) return

        this.updateHeading(train)

        if (this.wheelActive) {
            this.wheelWasActive = true
        } else if (now < (this.flyEnd || 0)) {
            // Let flyTo/easeTo finish before the hard tracking lock resumes.
        } else if (this.wheelWasActive) {
            this.wheelWasActive = false
            this.flyEnd = now + 700
            this.map.easeTo({
                center: train.marker.getLngLat(),
                bearing: this.getBearing(),
                duration: 600,
                essential: true
            })
        } else if (now >= (this.flyEnd || 0)) {
            this.map.jumpTo({
                center: train.marker.getLngLat(),
                bearing: this.getBearing()
            })
        }
    }

    updateHeading(train) {
        const rawHeading = this.computeHeading(train)
        if (this.heading == null) {
            this.heading = rawHeading
            return
        }

        let diff = rawHeading - this.heading
        if (diff > 180) diff -= 360
        if (diff < -180) diff += 360
        this.heading = (this.heading + diff * 0.15 + 360) % 360
    }

    getBearing() {
        if (this.view === 'bird') {
            return (this.heading - 90 + 360) % 360
        }
        return this.heading
    }

    getPitch() {
        return this.view === 'bird' ? 0 : 60
    }

    lockMap() {
        if (this.mapLocked) return
        this.mapLocked = true
        this.map.dragPan.disable()
        this.map.dragRotate.disable()
        this.map.touchZoomRotate.disable()
        this.map.doubleClickZoom.disable()

        if (!this.wheelBound) {
            this.wheelBound = true
            this.map.getCanvas().addEventListener('wheel', () => {
                this.wheelActive = true
                clearTimeout(this.wheelTimer)
                this.wheelTimer = setTimeout(() => { this.wheelActive = false }, 400)
            }, { passive: true })
        }
    }

    unlockMap() {
        if (!this.mapLocked) return
        this.mapLocked = false
        this.map.dragPan.enable()
        this.map.dragRotate.enable()
        this.map.touchZoomRotate.enable()
        this.map.doubleClickZoom.enable()
    }

    applyTrackedMarker() {
        if (!this.trackedEl || !this.trackedTrain) return
        this.trackedEl.dataset.tracked = 'true'
        this.trackedTrain.isTracked = true
        this.trackedTrain.syncHitArea?.()
    }

    resetMarker() {
        if (this.trackedEl) {
            delete this.trackedEl.dataset.tracked
        }
        if (this.trackedTrain) {
            this.trackedTrain.isTracked = false
            this.trackedTrain.syncHitArea?.()
        }
        this.trackedEl = null
    }
}
