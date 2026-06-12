export const routePanelLabels = {
    title: { en: 'Route', zh: '路线', ta: 'பாதை' },
    stations: { en: 'stations', zh: '站', ta: 'நிலையங்கள்' },
    transfer: { en: 'transfer', zh: '换乘', ta: 'மாற்றம்' },
    transfers: { en: 'transfers', zh: '换乘', ta: 'மாற்றங்கள்' },
    to: { en: 'to', zh: '至', ta: 'நோக்கி' },
}

export const routeAlgorithmLabels = [
    { key: 'bfs', en: 'Fewest Stops', zh: '最少站点', ta: 'குறைந்த நிறுத்தங்கள்' },
    { key: 'dijkstra', en: 'Shortest Path', zh: '最短路径', ta: 'குறுகிய பாதை' },
    { key: 'fewest-transfers', en: 'Fewest Transfers', zh: '最少换乘', ta: 'குறைந்த மாற்றங்கள்' },
]

export const stationPanelLabels = {
    route: { en: 'Route', zh: '线路', ta: 'வழித்தடம்' },
    nextTrains: { en: 'Next Trains', zh: '列车预报', ta: 'அடுத்த ரயில்கள்' },
    to: { en: 'to', zh: '开往', ta: 'நோக்கி' },
    exits: { en: 'Exits', zh: '出口', ta: 'வெளியேறும் வழிகள்' },
    exit: { en: 'Exit', zh: '出口', ta: 'வெளியேறும் வழி' },
    missingExitInfo: { en: 'No nearby info', zh: '暂无附近信息', ta: 'அருகிலுள்ள தகவல் இல்லை' },
    more: { en: 'more', zh: '更多', ta: 'மேலும்' },
}

export const linePanelLabels = {
    stations: { en: 'Stations', zh: '站点', ta: 'நிலையங்கள்' },
    length: { en: 'Length', zh: '长度', ta: 'நீளம்' },
    network: { en: 'Network', zh: '网络', ta: 'வலைப்பின்னல்' },
    terminal: { en: 'Terminal', zh: '总站', ta: 'முனையம்' },
}

export function getPanelLabel(labels, key, language) {
    return labels[key]?.[language] || labels[key]?.en || key
}
