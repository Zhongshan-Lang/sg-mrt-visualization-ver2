import { startLineTourCamera } from '../../camera/lineTourCamera'
import { setMapCursor } from './mapCursor'
import { hasStationFeatureAtPoint } from './mapInteractionPriority'
import { clearActiveEntranceMarker, clearInteractionPopups } from './mapInteractionState'
import { buildLinePopupHTML } from './linePopupMarkup'

export function registerLineInteractions({
    map,
    popup,
    linePopup,
    popupActiveRef,
    activeEntranceMarkerRef,
    getTheme,
    callbacks
}) {
    const {
        setSelectedStation, setSelectedLine, setSelectedLines,
        setIsEntering
    } = callbacks

    map.on('mouseenter', 'mrt-line-layer', () => {
        setMapCursor(map, 'pointer')
    })

    map.on('mousemove', 'mrt-line-layer', (e) => {
        if (popupActiveRef.current) return
        const props = e.features?.[0]?.properties
        if (!props) return
        linePopup.setLngLat(e.lngLat).setHTML(buildLinePopupHTML(props, getTheme())).addTo(map)
    })

    map.on('mouseleave', 'mrt-line-layer', () => {
        setMapCursor(map)
        if (popupActiveRef.current) return
        linePopup.remove()
    })

    map.on('click', 'mrt-line-layer', (e) => {
        clearActiveEntranceMarker(activeEntranceMarkerRef)
        clearInteractionPopups({ popup, linePopup, popupActiveRef })

        if (hasStationFeatureAtPoint(map, e.point)) return

        setSelectedStation(null)

        const feature = e.features[0]
        const props = feature.properties

        startLineTourCamera({ current: map }, props.code, feature)

        setIsEntering(true)
        setSelectedLine({ ...props })
        setSelectedLines([props.code])
        setTimeout(() => setIsEntering(false), 150)
    })
}
