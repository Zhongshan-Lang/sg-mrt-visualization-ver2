export function createInteractionState() {
    return {
        popupActiveRef: { current: false },
        activeEntranceMarkerRef: { current: null }
    }
}

export function clearActiveEntranceMarker(activeEntranceMarkerRef) {
    if (!activeEntranceMarkerRef?.current) return
    activeEntranceMarkerRef.current.remove()
    activeEntranceMarkerRef.current = null
}

export function clearInteractionPopups({ popup, linePopup, popupActiveRef }) {
    popup?.remove()
    linePopup?.remove()
    if (popupActiveRef) {
        popupActiveRef.current = false
    }
}
