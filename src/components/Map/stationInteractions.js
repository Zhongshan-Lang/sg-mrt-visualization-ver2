import { stationLineToActualCode, lineColors } from '../../config'
import { loadStationImages } from '../../data/loaders/stationImages'
import { lrtHubLines } from '../../routing/specialLineRules'
import { focusStationCamera } from '../../camera/stationCamera'
import { stopLineTourCamera } from '../../camera/lineTourCamera'

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

        map.getCanvas().style.cursor = 'pointer'

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
        map.getCanvas().style.cursor = ''

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
        if (activeEntranceMarkerRef.current) {
            activeEntranceMarkerRef.current.remove()
            activeEntranceMarkerRef.current = null
        }

        popup.remove()
        linePopup.remove()
        popupActiveRef.current = false
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

function buildStationPopupHTML(props, imageUrl, t) {
    return `
    <div id="station-popup" style="width:260px;background:${t.popupBg};backdrop-filter:blur(24px);border-radius:22px;overflow:hidden;color:${t.textPrimary};font-family:sans-serif;box-shadow:${t.shadowPopup};border:1px solid ${t.borderMedium};animation:popupEnter 0.25s cubic-bezier(0.22,1,0.36,1);">
      <div style="position:relative;">
        <img src="${imageUrl}" style="width:100%;height:140px;object-fit:cover;display:block;" />
        <div style="position:absolute;inset:0;background:${t.popupGradient};"></div>
        <div style="position:absolute;left:16px;bottom:14px;">
          <div style="font-size:22px;font-weight:700;line-height:1;">${props.name}</div>
          <div style="margin-top:6px;font-size:14px;opacity:0.82;">${props.name_zh || ''}</div>
          <div style="margin-top:4px;font-size:11px;opacity:0.58;">${props.name_ta || ''}</div>
        </div>
      </div>
      <div style="padding:16px;">
        <div style="display:flex;flex-wrap:wrap;gap:8px;">
          ${(props.station_codes || '').split('-').map(line => {
        const prefix = line.match(/^[A-Z]+/)?.[0]
        const actualCode = stationLineToActualCode[prefix] || prefix
        const color = lineColors[actualCode] || '#808080'
        return `<div style="background:${color};padding:6px 14px;border-radius:999px;font-size:13px;font-weight:bold;color:white;box-shadow:0 0 10px ${color}55;">${line}</div>`
    }).join('')}
        </div>
      </div>
    </div>
  `
}
