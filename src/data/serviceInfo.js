export const stationFacilityLabels = {
    title: {
        en: 'Facilities',
        zh: '设施',
        ta: 'வசதிகள்'
    },
    accessibility: {
        en: 'Barrier-free access',
        zh: '无障碍通行',
        ta: 'தடையற்ற அணுகல்'
    },
    lifts: {
        en: 'Lift access',
        zh: '电梯通行',
        ta: 'லிப்ட் அணுகல்'
    },
    tactile: {
        en: 'Tactile guidance',
        zh: '触觉引导',
        ta: 'தொட்டு வழிகாட்டி'
    },
    wideGate: {
        en: 'Wide fare gate',
        zh: '宽闸机',
        ta: 'அகல கட்டண வாயில்'
    },
    toilet: {
        en: 'Toilet',
        zh: '洗手间',
        ta: 'கழிப்பறை'
    },
    serviceCentre: {
        en: 'Passenger service centre',
        zh: '客服中心',
        ta: 'பயணிகள் சேவை மையம்'
    },
    firstLast: {
        en: 'First / last train',
        zh: '首末班车',
        ta: 'முதல் / கடைசி ரயில்'
    },
    operatingHours: {
        en: 'Operating hours',
        zh: '运营时间',
        ta: 'சேவை நேரங்கள்'
    },
    available: {
        en: 'Available',
        zh: '可用',
        ta: 'கிடைக்கும்'
    },
    pending: {
        en: 'Station-specific data pending',
        zh: '车站详细信息待补充',
        ta: 'நிலையத் தகவல் பின்னர் சேர்க்கப்படும்'
    },
    generalHours: {
        en: 'Most MRT/LRT services run from early morning to around midnight. Check official timings for this station.',
        zh: '大多数 MRT/LRT 服务从清晨运营至午夜前后，本车站的准确时间请以官方信息为准。',
        ta: 'பெரும்பாலான MRT/LRT சேவைகள் அதிகாலை முதல் நள்ளிரவு வரை இயங்கும். இந்த நிலையத்தின் துல்லியமான நேரத்தை அதிகாரப்பூர்வ தகவலில் பார்க்கவும்.'
    }
}

export const routeFareLabels = {
    fare: {
        en: 'Estimated fare',
        zh: '票价估算',
        ta: 'கணிக்கப்பட்ட கட்டணம்'
    },
    adultCard: {
        en: 'Adult card',
        zh: '成人卡',
        ta: 'வயது வந்தோர் அட்டை'
    },
    distance: {
        en: 'Estimated distance',
        zh: '预计距离',
        ta: 'கணிக்கப்பட்ட தூரம்'
    },
    note: {
        en: 'Distance-based estimate. Use official fare tools for exact fares.',
        zh: '基于距离的估算，精确票价请以官方票价工具为准。',
        ta: 'இது தூர அடிப்படையிலான கணிப்பு. துல்லியமான கட்டணத்திற்கு அதிகாரப்பூர்வ கருவிகளை பயன்படுத்தவும்.'
    }
}

export const defaultStationFacilities = [
    { key: 'accessibility', status: 'available' },
    { key: 'lifts', status: 'available' },
    { key: 'tactile', status: 'available' },
    { key: 'wideGate', status: 'available' },
    { key: 'toilet', status: 'pending' },
    { key: 'serviceCentre', status: 'pending' },
    { key: 'firstLast', status: 'pending' },
    { key: 'operatingHours', status: 'generalHours', wide: true }
]

const adultMrtLrtFareBands = [
    { maxKm: 3.2, fare: 1.28 },
    { maxKm: 4.2, fare: 1.38 },
    { maxKm: 5.2, fare: 1.49 },
    { maxKm: 6.2, fare: 1.59 },
    { maxKm: 7.2, fare: 1.68 },
    { maxKm: 8.2, fare: 1.75 },
    { maxKm: 9.2, fare: 1.82 },
    { maxKm: 10.2, fare: 1.86 },
    { maxKm: 11.2, fare: 1.90 },
    { maxKm: 12.2, fare: 1.94 },
    { maxKm: 13.2, fare: 1.98 },
    { maxKm: 14.2, fare: 2.02 },
    { maxKm: 15.2, fare: 2.07 },
    { maxKm: 16.2, fare: 2.11 },
    { maxKm: 17.2, fare: 2.15 },
    { maxKm: 18.2, fare: 2.20 },
    { maxKm: 19.2, fare: 2.24 },
    { maxKm: 20.2, fare: 2.27 },
    { maxKm: 21.2, fare: 2.30 },
    { maxKm: 22.2, fare: 2.33 },
    { maxKm: 23.2, fare: 2.36 },
    { maxKm: 24.2, fare: 2.38 },
    { maxKm: 25.2, fare: 2.40 },
    { maxKm: 26.2, fare: 2.42 },
    { maxKm: 27.2, fare: 2.43 },
    { maxKm: 28.2, fare: 2.44 },
    { maxKm: 29.2, fare: 2.45 },
    { maxKm: 30.2, fare: 2.46 },
    { maxKm: 31.2, fare: 2.47 },
    { maxKm: 32.2, fare: 2.48 },
    { maxKm: 33.2, fare: 2.49 },
    { maxKm: 34.2, fare: 2.50 },
    { maxKm: 35.2, fare: 2.51 },
    { maxKm: 36.2, fare: 2.52 },
    { maxKm: 37.2, fare: 2.53 },
    { maxKm: 38.2, fare: 2.54 },
    { maxKm: 39.2, fare: 2.55 },
    { maxKm: 40.2, fare: 2.56 },
    { maxKm: Infinity, fare: 2.57 }
]

export function localServiceLabel(labels, key, language) {
    return labels[key]?.[language] || labels[key]?.en || key
}

export function estimateRouteFareFromStops(stops) {
    const distanceKm = Math.max(1, Math.round(stops * 1.25 * 10) / 10)
    const band = adultMrtLrtFareBands.find(item => distanceKm <= item.maxKm) || adultMrtLrtFareBands[adultMrtLrtFareBands.length - 1]
    return { distanceKm, fare: band.fare }
}
