import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GEOJSON_PATH = path.join(ROOT, 'src/data/sg-rail.geo.json')
const OUTPUT_DIR = path.join(ROOT, 'src/data/generated')

const stationLineToActualCode = {
    CE: 'CC',
    CG: 'EW',
    BP: 'BP',
    PE: 'PE',
    PW: 'PW',
    SE: 'SE',
    SW: 'SW',
    NS: 'NS',
    EW: 'EW',
    NE: 'NE',
    CC: 'CC',
    DT: 'DT',
    TE: 'TE',
}

const lineNameToCode = [
    ['North South', 'NS'],
    ['East West', 'EW'],
    ['North East', 'NE'],
    ['Circle', 'CC'],
    ['Downtown', 'DT'],
    ['Thomson-East Coast', 'TE'],
    ['Bukit Panjang', 'BP'],
    ['Sengkang', 'SE'],
    ['Punggol', 'PE'],
]

function inferLineCode(properties = {}) {
    if (properties.code) return properties.code
    const name = properties.name || ''
    return lineNameToCode.find(([needle]) => name.includes(needle))?.[1] || null
}

function stationNumber(code) {
    return Number.parseInt(code.match(/\d+/)?.[0] || 0, 10)
}

function sortLineSequences(generatedLineSequences) {
    const lineOrderMap = {
        CC: ['CC1', 'CC2', 'CC3', 'CC4', 'CE1', 'CE2', 'CC5', 'CC6', 'CC7', 'CC8', 'CC9', 'CC10',
            'CC11', 'CC12', 'CC13', 'CC14', 'CC15', 'CC16', 'CC17', 'CC19', 'CC20', 'CC21', 'CC22',
            'CC23', 'CC24', 'CC25', 'CC26', 'CC27', 'CC28', 'CC29'],
        EW: ['EW1', 'EW2', 'EW3', 'EW4', 'CG', 'CG1', 'CG2', 'EW5', 'EW6', 'EW7', 'EW8', 'EW9',
            'EW10', 'EW11', 'EW12', 'EW13', 'EW14', 'EW15', 'EW16', 'EW17', 'EW18', 'EW19', 'EW20',
            'EW21', 'EW22', 'EW23', 'EW24', 'EW25', 'EW26', 'EW27', 'EW28', 'EW29', 'EW30', 'EW31', 'EW32', 'EW33']
    }

    Object.keys(generatedLineSequences).forEach(line => {
        const orderMap = lineOrderMap[line]
        if (orderMap) {
            generatedLineSequences[line].sort((a, b) => {
                const indexA = orderMap.indexOf(a)
                const indexB = orderMap.indexOf(b)
                if (indexA !== -1 && indexB !== -1) return indexA - indexB
                if (indexA !== -1) return -1
                if (indexB !== -1) return 1
                return stationNumber(a) - stationNumber(b)
            })
        } else {
            generatedLineSequences[line].sort((a, b) => stationNumber(a) - stationNumber(b))
        }
    })
}

function stable(value) {
    return JSON.stringify(value, null, 2)
}

const mrtData = JSON.parse(await fs.readFile(GEOJSON_PATH, 'utf8'))

const stationCodeToName = {}
const stationCodeToData = {}
const stationCodeGroups = {}
const stationEntrancesByCodes = {}
const linePropertiesByCode = {}
const generatedLineSequences = {}

mrtData.features.forEach(feature => {
    const props = feature.properties || {}

    if ((feature.geometry?.type === 'LineString' || feature.geometry?.type === 'MultiLineString')) {
        const code = inferLineCode(props)
        if (code && !linePropertiesByCode[code]) {
            linePropertiesByCode[code] = { ...props, code }
        }
    }

    if (props.stop_type === 'entrance') {
        const key = props.station_codes || ''
        if (!stationEntrancesByCodes[key]) stationEntrancesByCodes[key] = []
        stationEntrancesByCodes[key].push({
            name: props.name,
            coordinates: feature.geometry.coordinates
        })
        return
    }

    if (props.type === 'subway' || feature.geometry?.type !== 'Point') return

    const stationCodes = props.station_codes
        ? (Array.isArray(props.station_codes) ? props.station_codes : props.station_codes.split('-'))
        : []

    stationCodes.forEach(code => {
        stationCodeToName[code] = props.name
        stationCodeToData[code] = {
            en: props.name,
            zh: props.name_zh,
            ta: props.name_ta
        }
        stationCodeGroups[code] = stationCodes

        const linePrefix = code.match(/[A-Z]+/)?.[0]
        const actualLine = stationLineToActualCode[linePrefix] || linePrefix
        if (!generatedLineSequences[actualLine]) generatedLineSequences[actualLine] = []
        generatedLineSequences[actualLine].push(code)
    })
})

sortLineSequences(generatedLineSequences)

const terminalStationCodes = getTerminalStationCodes(generatedLineSequences)

await fs.mkdir(OUTPUT_DIR, { recursive: true })

await writeGeneratedModule('stationIndex.js', [
    ['stationCodeToName', stationCodeToName],
    ['stationCodeToData', stationCodeToData],
    ['stationCodeGroups', stationCodeGroups]
])

await writeGeneratedModule('stationEntrances.js', [
    ['stationEntrancesByCodes', stationEntrancesByCodes]
])

await writeGeneratedModule('lineIndex.js', [
    ['linePropertiesByCode', linePropertiesByCode],
    ['generatedLineSequences', generatedLineSequences],
    ['terminalStationCodes', terminalStationCodes]
])

console.log(`Generated ${path.relative(ROOT, OUTPUT_DIR)}`)

async function writeGeneratedModule(filename, exports) {
    const content = [
        '// Generated by scripts/buildRuntimeIndexes.mjs. Do not edit by hand.',
        '',
        ...exports.flatMap(([name, value]) => [
            `export const ${name} = ${stable(value)}`,
            ''
        ])
    ].join('\n')
    await fs.writeFile(path.join(OUTPUT_DIR, filename), content, 'utf8')
}

function getTerminalStationCodes(lineSequences) {
    const terminals = new Set()

    Object.entries(lineSequences).forEach(([line, sequence]) => {
        if (!Array.isArray(sequence) || sequence.length === 0) return
        if (line === 'PTC' || line === 'STC') return

        terminals.add(sequence[0])
        terminals.add(sequence[sequence.length - 1])
    })

    ;['CG2', 'CE2'].forEach(code => terminals.add(code))

    return [...terminals].sort()
}
