// src/config.js

// 换乘站 Polygon 颜色顺序覆盖表
// station_codes → 对应每个 Polygon 的线路前缀（按 GeoJSON 中的出现顺序）
// 未列出的换乘站使用自动顺序（第 N 个 polygon → 第 N 条线路编码）
export const transferPolygonLineOrder = {
    'NE1-CC29':      ['CC', 'NE'],
    'CC17-TE9':      ['TE', 'CC'],
    'CC10-DT26':     ['DT', 'CC'],
    'CC19-DT9':      ['DT', 'CC'],
    'DT10-TE11':     ['TE', 'DT'],
    'NE4-DT19':      ['DT', 'NE'],
    'DT35-CG1':      ['CG', 'DT'],
    'NS26-EW14':     ['EW'],
    'NS1-EW24':      ['EW', 'NS'],
    'EW16-NE3-TE17': ['EW', 'TE', 'NE'],
    'NS24-NE6-CC1':  ['NE', 'NS', 'CC'],
}

export const lineColors = {
    NS: '#d42e12',
    EW: '#009645',
    NE: '#9900aa',
    CC: '#fa9e0d',
    DT: '#005ec4',
    TE: '#9D5B25',
    CG: '#009645',
    CE: '#fa9e0d',
    BP: '#808080',
    PE: '#808080',
    PW: '#808080',
    SE: '#808080',
    SW: '#808080',
    STC: '#808080',
    PTC: '#808080',
}

export const lineCameraPresets = {
    NS: { center: [103.80, 1.322], zoom: 12.08, pitch: 62, bearing: -18 },
    EW: { center: [103.76, 1.325], zoom: 11.6, pitch: 48, bearing: 37 },
    NE: { center: [103.85, 1.329], zoom: 12.33, pitch: 47, bearing: -35 },
    CC: { center: [103.82, 1.314], zoom: 12.4, pitch: 60, bearing: -14 },
    DT: { center: [103.85, 1.337], zoom: 12.19, pitch: 34, bearing: 37 },
    TE: { center: [103.85, 1.337], zoom: 12.11, pitch: 50, bearing: 0 },
    CG: { center: [103.99, 1.355], zoom: 12.2, pitch: 68, bearing: -42 },
    CE: { center: [103.86, 1.285], zoom: 13.2, pitch: 70, bearing: -35 },
    BP: { center: [103.76, 1.382], zoom: 14.62, pitch: 60, bearing: -19 },
    PE: { center: [103.9, 1.406], zoom: 14.59, pitch: 59, bearing: 80 },
    PW: { center: [103.9, 1.406], zoom: 14.59, pitch: 59, bearing: 80 },
    SE: { center: [103.89, 1.391], zoom: 14.37, pitch: 60, bearing: -35 },
    SW: { center: [103.89, 1.391], zoom: 14.37, pitch: 60, bearing: -35 },
}

export const stationLineToActualCode = {
    'CE': 'CC',
    'CG': 'EW',
    'BP': 'BP',
    'PE': 'PE',
    'PW': 'PW',
    'SE': 'SE',
    'SW': 'SW',
    'NS': 'NS',
    'EW': 'EW',
    'NE': 'NE',
    'CC': 'CC',
    'DT': 'DT',
    'TE': 'TE',
}