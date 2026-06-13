import { stationCodeGroups, stationCodeToData } from '../../data/generated/stationIndex'
import { getStationLines } from '../../routing/navigationUtils'

export const lineFullNames = {
    NS: 'North South Line',
    EW: 'East West Line',
    CG: 'Changi Airport Branch',
    NE: 'North East Line',
    CC: 'Circle Line',
    CE: 'Circle Line Extension',
    DT: 'Downtown Line',
    TE: 'Thomson-East Coast Line',
    BP: 'Bukit Panjang LRT',
    SE: 'Sengkang East LRT',
    SW: 'Sengkang West LRT',
    PE: 'Punggol East LRT',
    PW: 'Punggol West LRT',
}

export const routeEndpointDotStyle = {
    width: '10px',
    height: '10px',
    minWidth: '10px',
    minHeight: '10px',
    flex: '0 0 10px',
    display: 'block',
    borderRadius: '50%',
    alignSelf: 'center'
}

export const routeEndpointNameStyle = {
    minWidth: 0,
    lineHeight: 1.35,
    overflowWrap: 'anywhere'
}

export const extraRouteLabels = {
    timeline: { en: 'Journey', zh: '行程', ta: 'பயணம்' },
    summary: { en: 'Trip summary', zh: '行程概览', ta: 'பயண சுருக்கம்' },
    depart: { en: 'Start from', zh: '从这里出发', ta: 'இங்கிருந்து தொடங்கு' },
    ride: { en: 'Take', zh: '乘坐', ta: 'ஏறு' },
    alight: { en: 'Arrive at', zh: '到达', ta: 'சென்று சேர்' },
    change: { en: 'Change at', zh: '在此换乘', ta: 'இங்கு மாறு' },
    recommendedExit: { en: 'Suggested exit', zh: '推荐出口', ta: 'பரிந்துரைக்கப்பட்ட வெளியேறு' },
    noExitInfo: { en: 'No exit landmark info available', zh: '暂无出口地标信息', ta: 'வெளியேறும் இட தகவல் இல்லை' },
    approx: { en: 'approx.', zh: '约', ta: 'சுமார்' },
    min: { en: 'min', zh: '分钟', ta: 'நிமிடம்' },
    stops: { en: 'stops', zh: '站', ta: 'நிறுத்தங்கள்' },
    via: { en: 'via', zh: '途经', ta: 'வழியாக' }
}

export function formatMetricLabel(label, language) {
    if (language !== 'en') return label
    return String(label)
        .replace(/\b[a-z]/g, char => char.toUpperCase())
        .replace('Approx.', 'Approx')
}

export function getTransferNote(step, language) {
    const line = step.line || ''
    const stationLines = getStationLines(step.station)
    const isLrtTransfer = ['BP', 'SE', 'SW', 'PE', 'PW'].includes(line)
    const isSameStation = stationLines.length > 1

    if (language === 'zh') {
        if (isLrtTransfer) return `换乘至 ${line} 轻轨环线，请留意方向与站台指示。`
        if (isSameStation) return `同站换乘至 ${line} 线，跟随站内指示前往对应站台。`
        return `换乘至 ${line} 线，请按站内指示前往下一段站台。`
    }

    if (language === 'ta') {
        if (isLrtTransfer) return `${line} LRT வளையத்திற்கு மாறவும். திசை மற்றும் நடைமேடை குறிகளைப் பார்க்கவும்.`
        if (isSameStation) return `அதே நிலையத்தில் ${line} வழித்தடத்திற்கு மாறவும். நிலைய குறிகளைப் பின்பற்றவும்.`
        return `${line} வழித்தடத்திற்கு மாறவும். அடுத்த நடைமேடைக்கு நிலைய குறிகளைப் பின்பற்றவும்.`
    }

    if (isLrtTransfer) return `Change to the ${line} LRT loop. Check direction and platform signs.`
    if (isSameStation) return `Same-station transfer to the ${line} Line. Follow signs to the platform.`
    return `Change to the ${line} Line. Follow station signs to the next platform.`
}

export function buildTimelineSteps(routeResult = []) {
    if (!routeResult?.length) return []

    const steps = []
    routeResult.forEach((segment, index) => {
        const start = segment.stations[0]
        const end = segment.stations[segment.stations.length - 1]
        const stopCount = Math.max(0, segment.stations.length - 1)

        if (index === 0) {
            steps.push({ type: 'depart', labelKey: 'depart', station: start })
        } else {
            steps.push({ type: 'transfer', labelKey: 'change', station: start, line: segment.line })
        }

        steps.push({
            type: 'ride',
            labelKey: 'ride',
            line: segment.line,
            station: start,
            endStation: end,
            stopCount
        })

        if (index === routeResult.length - 1) {
            steps.push({ type: 'arrive', labelKey: 'alight', station: end })
        }
    })

    return steps
}

export function getJourneyStats(routeResult = [], transferCount = 0) {
    const stops = routeResult.reduce((sum, segment) => sum + Math.max(0, segment.stations.length - 1), 0)
    const minutes = Math.max(1, Math.round(stops * 2 + Math.max(0, transferCount) * 5 + 2))
    return { stops, minutes }
}

export function getStationName(stationCode, language) {
    return stationCodeToData[stationCode]?.[language] || stationCodeToData[stationCode]?.en || stationCode
}

export function getStationKey(stationCode) {
    const codes = stationCodeGroups[stationCode] || (stationCode ? [stationCode] : [])
    return codes.join('-')
}

export function getRecommendedExit(entrances, landmarksByExit) {
    const rankedEntrances = [...(entrances || [])]
    if (!rankedEntrances.length) return null

    rankedEntrances.sort((a, b) => naturalExitSort(a.name, b.name))

    const ranked = rankedEntrances
        .map(entrance => ({
            name: entrance.name,
            landmarks: landmarksByExit[entrance.name] || []
        }))
        .sort((a, b) => {
            if (b.landmarks.length !== a.landmarks.length) return b.landmarks.length - a.landmarks.length
            return naturalExitSort(a.name, b.name)
        })

    return ranked.find(item => item.landmarks.length > 0) || null
}

export function naturalExitSort(a, b) {
    const ia = parseInt(a)
    const ib = parseInt(b)
    if (!Number.isNaN(ia) && !Number.isNaN(ib)) return ia - ib
    if (!Number.isNaN(ia)) return -1
    if (!Number.isNaN(ib)) return 1
    return String(a).localeCompare(String(b))
}
