import maplibregl from 'maplibre-gl'
import { focusEntranceCamera, focusStationCamera } from '../../camera/stationCamera'

export default function StationExitsSection({
    stationEntrances,
    panelLabel,
    animated,
    getExitLandmarks,
    mapRef,
    activeEntranceMarkerRef,
    selectedStation,
    t
}) {
    if (!stationEntrances.length) return null

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px', ...animated(0.8) }}>
                {panelLabel('exits')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stationEntrances.map((entrance, index) => {
                    const exitName = entrance.name
                    const landmarks = getExitLandmarks(exitName)
                    return (
                        <div
                            key={index}
                            onClick={() => {
                                if (!mapRef.current) return
                                if (activeEntranceMarkerRef?.current) {
                                    const currentMarkerPos = activeEntranceMarkerRef.current.getLngLat()
                                    const clickedPos = entrance.coordinates
                                    if (currentMarkerPos.lng === clickedPos[0] && currentMarkerPos.lat === clickedPos[1]) {
                                        focusStationCamera(
                                            mapRef.current,
                                            selectedStation.geometry?.coordinates || [103.851959, 1.290270],
                                            { duration: 800 }
                                        )
                                        activeEntranceMarkerRef.current.remove()
                                        activeEntranceMarkerRef.current = null
                                        return
                                    }
                                    activeEntranceMarkerRef.current.remove()
                                }
                                focusEntranceCamera(mapRef.current, entrance.coordinates)
                                const marker = new maplibregl.Marker({
                                    color: t.entranceMarker, opacity: '0.9', scale: 1.2
                                }).setLngLat(entrance.coordinates).addTo(mapRef.current)
                                if (activeEntranceMarkerRef) activeEntranceMarkerRef.current = marker
                            }}
                            style={{
                                background: t.overlayStrong, padding: '10px 12px',
                                borderRadius: '10px', cursor: 'pointer', transition: '0.2s'
                            }}
                            onMouseEnter={(event) => { event.currentTarget.style.background = t.overlayHover }}
                            onMouseLeave={(event) => { event.currentTarget.style.background = t.overlayStrong }}
                        >
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                    background: t.entranceMarker, color: '#000',
                                    padding: '3px 10px', borderRadius: '6px',
                                    fontSize: '13px', fontWeight: 'bold',
                                    whiteSpace: 'nowrap', flexShrink: 0,
                                    ...animated()
                                }}>{panelLabel('exit')} {exitName}</span>
                                {landmarks.length > 0 ? (
                                    landmarks.slice(0, 6).map((landmark, landmarkIndex) => (
                                        <span
                                            key={landmarkIndex}
                                            style={{
                                                fontSize: '11px', color: t.textSecondary,
                                                background: t.overlayMedium,
                                                padding: '2px 6px', borderRadius: '4px',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >{landmark.name}</span>
                                    ))
                                ) : (
                                    <span style={{
                                        fontSize: '11px', color: t.textSecondary,
                                        fontStyle: 'italic',
                                        ...animated()
                                    }}>{panelLabel('missingExitInfo')}</span>
                                )}
                                {landmarks.length > 6 && (
                                    <span style={{ fontSize: '11px', color: t.textSecondary, ...animated() }}>
                                        +{landmarks.length - 6} {panelLabel('more')}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
