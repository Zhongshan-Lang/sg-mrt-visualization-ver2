import { useCallback, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useTheme } from '../../contexts/ThemeContext'
import { registerStationInteractions, STATION_INTERACTION_LAYERS } from './stationInteractions'
import { registerLineInteractions } from './lineInteractions'

export function useMapInteractions(mapRef, callbacks) {
    const { t } = useTheme()
    const tRef = useRef(t)
    tRef.current = t

    const { closePanel, closeLinePanel } = callbacks

    const getTheme = () => tRef.current

    const popupRef = useRef(null)
    const linePopupRef = useRef(null)
    if (!popupRef.current) {
        popupRef.current = new maplibregl.Popup({
            closeButton: false, closeOnClick: false, offset: 25
        })
    }
    if (!linePopupRef.current) {
        linePopupRef.current = new maplibregl.Popup({
            closeButton: false, closeOnClick: false, offset: 12
        })
    }

    const setupInteractions = useCallback(() => {
        const map = mapRef.current
        if (!map) return

        ;['mouseenter', 'mouseleave', 'click', 'mousemove'].forEach(event => {
            STATION_INTERACTION_LAYERS.forEach(layerId => map.off(event, layerId))
            map.off(event, 'mrt-line-layer')
        })

        const popup = popupRef.current
        const linePopup = linePopupRef.current
        const popupActiveRef = { current: false }
        const activeEntranceMarkerRef = { current: null }

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

        map.on('click', (e) => {
            const stationFeatures = map.queryRenderedFeatures(e.point, { layers: STATION_INTERACTION_LAYERS })
            const lineFeatures = map.queryRenderedFeatures(e.point, { layers: ['mrt-line-layer'] })

            if (!stationFeatures.length && !lineFeatures.length) {
                popup.remove()
                linePopup.remove()
                popupActiveRef.current = false
                closePanel()
                closeLinePanel()
            }
        })

        return { activeEntranceMarkerRef }
    }, [mapRef, callbacks, closePanel, closeLinePanel])

    return { setupInteractions }
}
