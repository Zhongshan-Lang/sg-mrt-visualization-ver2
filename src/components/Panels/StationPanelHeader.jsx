import { stationLineToActualCode, lineColors } from '../../config'
import { linePropertiesByCode } from '../../data/generated/lineIndex'
import { findLineFeature, flyToLine } from '../../utils/stationUtils'

export default function StationPanelHeader({
    selectedStation,
    bookmarks,
    onToggleBookmark,
    onClose,
    mrtData,
    mapRef,
    setSelectedLine,
    setSelectedLines,
    setIsEntering,
    t
}) {
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '30px', fontWeight: 'bold' }}>{selectedStation.name}</div>
                <button
                    onClick={() => onToggleBookmark(selectedStation.station_codes)}
                    style={{
                        width: '32px', height: '32px', border: 'none', borderRadius: '50%',
                        background: 'transparent',
                        color: bookmarks.includes(selectedStation.station_codes) ? t.bookmarkActive : t.bookmarkInactive,
                        cursor: 'pointer', fontSize: '22px', transition: '0.2s', marginRight: '8px'
                    }}
                    title={bookmarks.includes(selectedStation.station_codes) ? 'cancel · 取消收藏' : 'bookmark · 收藏站点'}
                >{bookmarks.includes(selectedStation.station_codes) ? '★' : '☆'}</button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '20px', opacity: 0.85 }}>{selectedStation.name_zh}</div>
            <div style={{ marginTop: '6px', fontSize: '14px', opacity: 0.6 }}>{selectedStation.name_ta}</div>

            <div style={{ marginTop: '22px', fontSize: '18px', fontWeight: 'bold' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '22px' }}>
                    {(selectedStation.station_codes || '').split('-').map((line, index) => {
                        const prefix = line.match(/[A-Z]+/)?.[0]
                        const actualCode = stationLineToActualCode[prefix] || prefix
                        return (
                            <div
                                key={index}
                                onClick={() => {
                                    onClose()
                                    const lineProperties = linePropertiesByCode[actualCode]
                                    if (lineProperties && mapRef.current) {
                                        flyToLine(actualCode, mapRef, setSelectedLine, setSelectedLines, setIsEntering, findLineFeature(mrtData, actualCode))
                                    }
                                }}
                                onMouseEnter={(event) => {
                                    event.currentTarget.style.transform = 'scale(1.08)'
                                    event.currentTarget.style.boxShadow = `0 0 16px ${lineColors[actualCode] || '#444'}`
                                }}
                                onMouseLeave={(event) => {
                                    event.currentTarget.style.transform = 'scale(1)'
                                    event.currentTarget.style.boxShadow = t.shadowBadge
                                }}
                                style={{
                                    background: lineColors[actualCode] || '#444',
                                    padding: '8px 14px', borderRadius: '999px',
                                    fontSize: '14px', fontWeight: 'bold', color: 'white',
                                    boxShadow: t.shadowBadge,
                                    cursor: 'pointer', transition: 'transform 0.25s, box-shadow 0.25s'
                                }}
                            >{line}</div>
                        )
                    })}
                </div>
            </div>
        </>
    )
}
