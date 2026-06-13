import { useCallback, useEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useTheme } from '../../contexts/ThemeContext'
import { registerStationInteractions } from './stationInteractions'
import { registerLineInteractions } from './lineInteractions'
import { clearMapClickBinding, clearMapInteractionBindings } from './mapInteractionCleanup'
import { shouldClosePanelsForMapClick } from './mapInteractionPriority'
import { clearInteractionPopups, createInteractionState } from './mapInteractionState'

export function useMapInteractions(mapRef, callbacks) {
    const { t } = useTheme()
    const tRef = useRef(t)
    const mapClickHandlerRef = useRef(null)

    const popup = useMemo(() => new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 25
    }), [])

    const linePopup = useMemo(() => new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12
    }), [])

    useEffect(() => {
        tRef.current = t
    }, [t])

    useEffect(() => () => {
        popup.remove()
        linePopup.remove()
    }, [linePopup, popup])

    const getTheme = () => tRef.current

    const setupInteractions = useCallback(() => {
        const map = mapRef.current
        if (!map) return

        clearMapInteractionBindings(map)
        clearMapClickBinding(map, mapClickHandlerRef)

        const { popupActiveRef, activeEntranceMarkerRef } = createInteractionState()

        registerStationInteractions({
            map,
            popup,
            linePopup,
            popupActiveRef,
            activeEntranceMarkerRef,
            getTheme,
            callbacks
        })

        registerLineInteractions({
            map,
            popup,
            linePopup,
            popupActiveRef,
            activeEntranceMarkerRef,
            getTheme,
            callbacks
        })

        const handleMapClick = (e) => {
            if (shouldClosePanelsForMapClick(map, e.point)) {
                clearInteractionPopups({ popup, linePopup, popupActiveRef })
                callbacks.closePanel()
                callbacks.closeLinePanel()
            }
        }

        mapClickHandlerRef.current = handleMapClick
        map.on('click', handleMapClick)

        return { activeEntranceMarkerRef }
    }, [callbacks, linePopup, mapRef, popup])

    return { setupInteractions }
}
