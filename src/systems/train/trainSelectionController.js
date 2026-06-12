export function createTrainSelectionController({
    map,
    trackingCamera,
    buildPanelData,
    getOnTrainSelect,
    startTracking,
    stopTracking,
}) {
    let ignoreMapClick = false
    let mapClickHooked = false
    let lastPanelRefresh = 0

    function emitPanel(train) {
        const onTrainSelect = getOnTrainSelect()
        if (onTrainSelect) {
            onTrainSelect(train ? buildPanelData(train) : null)
        }
    }

    function clearSelection() {
        stopTracking()
        emitPanel(null)
    }

    function handleMarkerClick(train, el) {
        ignoreMapClick = true
        setTimeout(() => { ignoreMapClick = false }, 100)

        if (trackingCamera.isTrackingTrain(train)) {
            clearSelection()
            return
        }

        startTracking(train, el)
        lastPanelRefresh = 0
        emitPanel(train)
    }

    function ensureMapClickBinding() {
        if (mapClickHooked) return
        mapClickHooked = true
        map.on('click', () => {
            if (ignoreMapClick) return
            clearSelection()
        })
    }

    function refreshTrackedPanel(now) {
        const train = trackingCamera.trackedTrain
        if (!train?.marker) return

        if (!lastPanelRefresh || now - lastPanelRefresh > 500) {
            lastPanelRefresh = now
            emitPanel(train)
        }
    }

    return {
        clearSelection,
        ensureMapClickBinding,
        handleMarkerClick,
        refreshTrackedPanel,
    }
}
