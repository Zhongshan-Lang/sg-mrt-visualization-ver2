import { stationCodeToData } from '../../data/generated/stationIndex'

const TRAIN_POPUP_LABELS = {
    to: 'To · 开往 · செல்லும்',
    next: 'Next · 下一站 · அடுத்து'
}

function popupTheme() {
    const dark = localStorage.getItem('mrt-theme') !== 'light'
    return {
        bg: dark ? 'rgba(18,18,18,0.94)' : 'rgba(255,255,255,0.94)',
        text: dark ? '#eee' : '#1a1a1a',
        border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        rowBg: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    }
}

function stationName(code, lang) {
    return stationCodeToData[code]?.[lang] || code || ''
}

function getAllCodesForStation(code, geojson) {
    if (!code) return [code]

    const feature = geojson?.features?.find(item =>
        item.geometry.type === 'Point' &&
        item.properties.stop_type !== 'entrance' &&
        item.properties.type !== 'subway' &&
        (item.properties.station_codes || '').split('-').includes(code)
    )

    if (feature) {
        return (feature.properties.station_codes || '').split('-')
    }

    return [code]
}

function badgeColor(code, routeColors) {
    const prefix = code?.match(/^[A-Z]+/)?.[0] || ''
    if (prefix === 'EW') return routeColors.EW_MAIN || '#009645'
    if (prefix === 'CC') return routeColors.CC_MAIN || '#fa9e0d'
    return routeColors[prefix] || '#808080'
}

function buildBadgesHTML(codes, routeColors) {
    return codes.map(code => {
        const color = badgeColor(code, routeColors)
        return `<span style="background:${color};padding:1px 7px;border-radius:999px;font-size:10px;font-weight:bold;color:#fff;margin-right:3px">${code}</span>`
    }).join('')
}

export function buildTrainPopupHTML(trainData, { geojson, routeColors, lineColor }) {
    const { nextCode, termCode, trainNum, shortName } = trainData
    const theme = popupTheme()
    const nextEn = stationName(nextCode, 'en')
    const nextZh = stationName(nextCode, 'zh')
    const nextTa = stationName(nextCode, 'ta')
    const termEn = stationName(termCode, 'en')
    const termZh = stationName(termCode, 'zh')
    const termTa = stationName(termCode, 'ta')
    const allNextCodes = getAllCodesForStation(nextCode, geojson)

    return `
    <div style="font-family:sans-serif;font-size:12px;min-width:220px;background:${theme.bg};backdrop-filter:blur(20px);border-radius:16px;color:${theme.text};border:1px solid ${theme.border};box-shadow:0 8px 32px rgba(0,0,0,0.18);overflow:hidden">
        <div style="height:4px;background:${lineColor}"></div>
        <div style="padding:12px 14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                <span style="width:8px;height:8px;border-radius:50%;background:${lineColor};flex-shrink:0"></span>
                <span style="font-weight:700;font-size:13px">${trainNum}</span>
                <span style="margin-left:auto;font-size:10px;opacity:0.5">${shortName}</span>
            </div>
            <div style="background:${theme.rowBg};border-radius:8px;padding:8px 10px;margin-bottom:6px">
                <div style="font-size:10px;opacity:0.5;margin-bottom:2px">${TRAIN_POPUP_LABELS.to}</div>
                <div style="font-weight:600;font-size:13px">${termEn}</div>
                <div style="font-size:11px;opacity:0.6">${termZh} · ${termTa}</div>
            </div>
            <div style="background:${theme.rowBg};border-radius:8px;padding:8px 10px">
                <div style="font-size:10px;opacity:0.5;margin-bottom:2px">${TRAIN_POPUP_LABELS.next}</div>
                <div style="font-weight:600;font-size:13px">${nextEn}</div>
                <div style="font-size:11px;opacity:0.6">${nextZh} · ${nextTa}</div>
                <div style="margin-top:4px">${buildBadgesHTML(allNextCodes, routeColors)}</div>
            </div>
        </div>
    </div>`
}
