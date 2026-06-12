import { startLineTourCamera } from '../../camera/lineTourCamera'
import { STATION_INTERACTION_LAYERS } from './stationInteractions'

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
        map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mousemove', 'mrt-line-layer', (e) => {
        if (popupActiveRef.current) return
        const props = e.features?.[0]?.properties
        if (!props) return
        linePopup.setLngLat(e.lngLat).setHTML(buildLinePopupHTML(props, getTheme())).addTo(map)
    })

    map.on('mouseleave', 'mrt-line-layer', () => {
        map.getCanvas().style.cursor = ''
        if (popupActiveRef.current) return
        linePopup.remove()
    })

    map.on('click', 'mrt-line-layer', (e) => {
        if (activeEntranceMarkerRef.current) {
            activeEntranceMarkerRef.current.remove()
            activeEntranceMarkerRef.current = null
        }

        popup.remove()
        linePopup.remove()
        popupActiveRef.current = false

        const stationFeatures = map.queryRenderedFeatures(e.point, { layers: STATION_INTERACTION_LAYERS })
        if (stationFeatures.length) return

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

function buildLinePopupHTML(props, t) {
    return `
        <div style="padding:16px 20px;background:${t.popupBg};backdrop-filter:blur(22px);border-radius:18px;color:${t.textPrimary};font-family:sans-serif;min-width:220px;border:1px solid ${t.borderMedium};box-shadow:${t.shadowPopupLine};">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:16px;height:16px;border-radius:999px;background:${props.color};"></div>
            <div style="font-size:18px;font-weight:700;">${props.code}</div>
          </div>
          <div style="margin-top:8px;font-size:15px;opacity:0.82;">${props.name}</div>
        </div>
      `
}
