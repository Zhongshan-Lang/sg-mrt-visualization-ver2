import { stationCodeToData } from '../../data/generated/stationIndex'

const TRAIN_POPUP_LABELS = {
    to: { en: 'To', zh: '开往', ta: 'நோக்கி' },
    next: { en: 'Next', zh: '下一站', ta: 'அடுத்து' }
}

function popupTheme() {
    const dark = localStorage.getItem('mrt-theme') !== 'light'
    return {
        bg: dark ? 'rgba(16,16,16,0.94)' : 'rgba(255,255,255,0.94)',
        text: dark ? '#f3f3f3' : '#171717',
        textMuted: dark ? 'rgba(255,255,255,0.58)' : 'rgba(0,0,0,0.48)',
        border: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
        rowBg: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        shadow: dark ? '0 10px 32px rgba(0,0,0,0.3)' : '0 10px 28px rgba(0,0,0,0.12)'
    }
}

function stationName(code, lang) {
    return stationCodeToData[code]?.[lang] || code || ''
}

function labelTriplet(key) {
    const label = TRAIN_POPUP_LABELS[key]
    return `${label.en} · ${label.zh} · ${label.ta}`
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
        return `<span style="background:${color};padding:2px 8px;border-radius:999px;font-size:10px;font-weight:700;color:#fff">${code}</span>`
    }).join('')
}

function buildStationNameBlock(code) {
    const en = stationName(code, 'en')
    const zh = stationName(code, 'zh')
    const ta = stationName(code, 'ta')

    return `
        <div style="font-weight:700;font-size:13px;line-height:1.2">${en}</div>
        <div style="margin-top:3px;font-size:11px;line-height:1.2;opacity:0.68">${zh}</div>
        <div style="margin-top:2px;font-size:10px;line-height:1.25;opacity:0.5">${ta}</div>
    `
}

export function buildTrainPopupHTML(trainData, { geojson, routeColors, lineColor }) {
    const { nextCode, termCode, trainNum, shortName } = trainData
    const theme = popupTheme()
    const allNextCodes = getAllCodesForStation(nextCode, geojson)

    return `
    <div style="font-family:sans-serif;font-size:12px;min-width:236px;background:${theme.bg};backdrop-filter:blur(20px);border-radius:18px;color:${theme.text};border:1px solid ${theme.border};box-shadow:${theme.shadow};overflow:hidden">
        <div style="height:4px;background:${lineColor}"></div>
        <div style="padding:12px 14px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                <span style="width:8px;height:8px;border-radius:50%;background:${lineColor};flex-shrink:0"></span>
                <span style="font-weight:700;font-size:13px">${trainNum}</span>
                <span style="margin-left:auto;font-size:10px;opacity:0.5">${shortName}</span>
            </div>
            <div style="background:${theme.rowBg};border-radius:10px;padding:9px 10px;margin-bottom:7px">
                <div style="font-size:10px;line-height:1.25;opacity:0.56;margin-bottom:5px">${labelTriplet('to')}</div>
                ${buildStationNameBlock(termCode)}
            </div>
            <div style="background:${theme.rowBg};border-radius:10px;padding:9px 10px">
                <div style="font-size:10px;line-height:1.25;opacity:0.56;margin-bottom:5px">${labelTriplet('next')}</div>
                ${buildStationNameBlock(nextCode)}
                <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">${buildBadgesHTML(allNextCodes, routeColors)}</div>
            </div>
        </div>
    </div>`
}
