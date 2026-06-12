import { generatedLineSequences } from '../data/generated/lineIndex'
import { isLrtLine, lrtTerminalLinks } from '../routing/specialLineRules'

export function getAdjacentStations(lineCode, stationCode) {
    const sequence = generatedLineSequences[lineCode]
    if (!sequence) return null

    const index = sequence.indexOf(stationCode)
    if (index === -1) return null

    let prev = sequence[index - 1] || null
    let next = sequence[index + 1] || null

    if (lineCode === 'CC') {
        if (stationCode === 'CE1') {
            prev = sequence.find(s => s === 'CE2') || null
            next = 'CC4'
        }
        if (stationCode === 'CE2') {
            prev = 'CE1'
            next = null
        }
        if (stationCode === 'CC4') {
            prev = sequence.find(s => s === 'CC3') || prev
            next = sequence.find(s => s === 'CC5') || next
        }
        if (stationCode === 'CC5') {
            prev = sequence.find(s => s === 'CC4') || prev
            next = sequence.find(s => s === 'CC6') || next
        }
    }

    if (lineCode === 'EW') {
        if (stationCode === 'CG') {
            prev = null
            next = sequence.find(s => s === 'CG1') || null
        }
        if (stationCode === 'CG1') {
            prev = 'CG'
            next = sequence.find(s => s === 'CG2') || null
        }
        if (stationCode === 'CG2') {
            prev = 'CG1'
            next = null
        }
        if (stationCode === 'EW4') {
            prev = sequence.find(s => s === 'EW3') || prev
            next = sequence.find(s => s === 'EW5') || next
        }
        if (stationCode === 'EW5') {
            prev = sequence.find(s => s === 'EW4') || prev
            next = sequence.find(s => s === 'EW6') || next
        }
    }

    if (isLrtLine(lineCode)) {
        const terminalRule = lrtTerminalLinks[lineCode]?.[stationCode]
        if (terminalRule) {
            if (terminalRule.prev) prev = terminalRule.prev
            if (terminalRule.next) next = terminalRule.next
            if (terminalRule.prevCode) prev = sequence.find(s => s === terminalRule.prevCode) || null
        }
    }

    return { prev, current: sequence[index], next }
}

export function parseLines(lines) {
    if (!lines) return []
    if (Array.isArray(lines)) return lines
    if (typeof lines === 'string') {
        try {
            const parsed = JSON.parse(lines)
            return Array.isArray(parsed) ? parsed : [lines]
        } catch {
            return [lines]
        }
    }
    return []
}
