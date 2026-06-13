import { useCallback, useEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import { useTheme } from '../../contexts/ThemeContext'
import { registerStationInteractions, STATION_INTERACTION_LAYERS } from './stationInteractions'
import { registerLineInteractions } from './lineInteractions'

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

        ;['mouseenter', 'mouseleave', 'click', 'mousemove'].forEach(event => {
            STATION_INTERACTION_LAYERS.forEach(layerId => map.off(event, layerId))
            map.off(event, 'mrt-line-layer')
        })

        if (mapClickHandlerRef.current) {
            map.off('click', mapClickHandlerRef.current)
        }

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

        const handleMapClick = (e) => {
            const stationFeatures = map.queryRenderedFeatures(e.point, { layers: STATION_INTERACTION_LAYERS })
            const lineFeatures = map.queryRenderedFeatures(e.point, { layers: ['mrt-line-layer'] })

            if (!stationFeatures.length && !lineFeatures.length) {
                popup.remove()
                linePopup.remove()
                popupActiveRef.current = false
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
