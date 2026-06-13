import { stationLineToActualCode, lineColors } from '../../config'

export function buildStationPopupHTML(props, imageUrl, t) {
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
