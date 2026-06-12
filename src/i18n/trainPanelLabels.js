export const trainPanelLabels = {
    train: { en: 'Train', zh: '列车', ta: 'ரயில்' },
    to: { en: 'To', zh: '开往', ta: 'செல்லும்' },
    next: { en: 'Next', zh: '下一站', ta: 'அடுத்து' },
    current: { en: 'Current', zh: '当前站', ta: 'இங்கு' },
    route: { en: 'Route', zh: '线路', ta: 'வழித்தடம்' },
}

export const trainTrackingViewLabels = [
    { key: 'bird', en: 'Bird', zh: '俯视', ta: 'மேலே' },
    { key: 'follow', en: 'Follow', zh: '追踪', ta: 'பின்தொடர்' },
]

export function getLocalizedLabel(labels, key, language) {
    return labels[key]?.[language] || labels[key]?.en || key
}
