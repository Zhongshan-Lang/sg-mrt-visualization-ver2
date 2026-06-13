import { stationLineToActualCode } from '../../config'
import { loadStationImages } from '../../data/loaders/stationImages'
import { lrtHubLines } from '../../routing/specialLineRules'
import { focusStationCamera } from '../../camera/stationCamera'
import { stopLineTourCamera } from '../../camera/lineTourCamera'
import { setMapCursor } from './mapCursor'
import { clearActiveEntranceMarker, clearInteractionPopups } from './mapInteractionState'
import { buildStationPopupHTML } from './stationPopupMarkup'

export const STATION_INTERACTION_LAYERS = ['station-core', 'station-core-local']

export function registerStationInteractions({
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
        setHoveredLines, setHoveredStationCodes,
        setIsStationHovered, setIsEntering, setCurrentImage,
        setPopupLines
    } = callbacks

    STATION_INTERACTION_LAYERS.forEach(layerId => map.on('mouseenter', layerId, (e) => {
        popupActiveRef.current = true
        setIsStationHovered(true)

        const props = e.features[0].properties
        setHoveredStationCodes(props.station_codes || '')

        setMapCursor(map, 'pointer')

        if (props.stop_type === 'entrance' || props.type === 'subway') return

        const coordinates = e.features[0].geometry.coordinates.slice()
        const linePrefixes = (props.station_codes || '').split('-')
            .map(line => {
                const prefix = line.match(/^[A-Z]+/)?.[0]
                return stationLineToActualCode[prefix] || prefix
            }).filter(Boolean)

        let uniqueLinePrefixes = [...new Set(linePrefixes)]

        linePrefixes.forEach(line => {
            if (lrtHubLines[line]) uniqueLinePrefixes.push(...lrtHubLines[line])
        })
        uniqueLinePrefixes = [...new Set(uniqueLinePrefixes)]

        setPopupLines(uniqueLinePrefixes)
        setHoveredLines(uniqueLinePrefixes)

        const fallbackImageUrl = 'https://placehold.co/600x400/111111/FFFFFF?text=Station'

        popup.setLngLat(coordinates).setHTML(buildStationPopupHTML(props, fallbackImageUrl, getTheme())).addTo(map)
        loadStationImages(props.name).then(images => {
            if (!popupActiveRef.current || !images[0]) return
            popup.setHTML(buildStationPopupHTML(props, images[0], getTheme()))
        })
    }))

    STATION_INTERACTION_LAYERS.forEach(layerId => map.on('mouseleave', layerId, () => {
        setIsStationHovered(false)
        setHoveredStationCodes(null)
        setHoveredLines([])
        setPopupLines([])
        setMapCursor(map)

        const popupElement = document.getElementById('station-popup')
        if (popupElement) {
            popupElement.style.animation = 'popupExit 0.22s cubic-bezier(0.22,1,0.36,1) forwards'
            setTimeout(() => {
                popup.remove()
                popupActiveRef.current = false
            }, 200)
        }
    }))

    STATION_INTERACTION_LAYERS.forEach(layerId => map.on('click', layerId, (e) => {
        clearActiveEntranceMarker(activeEntranceMarkerRef)
        clearInteractionPopups({ popup, linePopup, popupActiveRef })
        stopLineTourCamera()
        setSelectedLine(null)

        const props = e.features[0].properties
        if (props.stop_type === 'entrance' || props.type === 'subway') return

        focusStationCamera(map, e.features[0].geometry.coordinates)

        setCurrentImage(0)

        const stationLines = (props.station_codes || '').split('-')
            .map(line => {
                const prefix = line.match(/^[A-Z]+/)?.[0]
                return stationLineToActualCode[prefix] || prefix
            }).filter(Boolean)

        setSelectedLines([...new Set(stationLines)])
        setIsEntering(true)

        setSelectedStation({
            ...props,
            geometry: e.features[0].geometry,
            lines: (props.station_codes || '').split('-'),
            station_codes: props.station_codes
        })

        setTimeout(() => setIsEntering(false), 150)
    }))
}
