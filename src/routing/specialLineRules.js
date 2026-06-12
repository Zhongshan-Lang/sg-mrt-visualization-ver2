export const LRT_LINES = ['BP', 'SE', 'SW', 'PE', 'PW']
export const LRT_LOOP_LINES = ['SE', 'SW', 'PE', 'PW']
export const PE_LINE = 'PE'
export const PE_UPPER_TERMINAL = 'PE7'
export const PE_LOWER_TERMINAL = 'PE1'
export const PTC_CODE = 'PTC'
export const STC_CODE = 'STC'

export const linePrefixGroups = {
    EW: [['EW'], ['CG']],
    CC: [['CC'], ['CE']]
}

export const branchBridges = {
    EW: [['EW5', 'CG']],
    CC: [['CC4', 'CE1']]
}

export const lrtHubLinks = {
    STC: { SE1: 'SE', SE5: 'SE', SW1: 'SW', SW8: 'SW' },
    PTC: { PE1: 'PE', PE7: 'PE', PW1: 'PW', PW7: 'PW' }
}

export const lrtHubLines = {
    STC: ['SE', 'SW'],
    PTC: ['PE', 'PW']
}

export const lrtLineHubs = {
    SE: STC_CODE,
    SW: STC_CODE,
    PE: PTC_CODE,
    PW: PTC_CODE
}

export const lrtTerminalLinks = {
    SW: {
        SW8: { next: STC_CODE },
        SW1: { prev: STC_CODE }
    },
    SE: {
        SE5: { next: STC_CODE },
        SE1: { prev: STC_CODE }
    },
    PW: {
        PW7: { next: PTC_CODE },
        PW1: { prev: PTC_CODE }
    },
    PE: {
        PE7: { next: PTC_CODE },
        PE1: { prev: PTC_CODE }
    },
    BP: {
        BP1: { prev: 'BP2', next: 'BP2' },
        BP13: { prevCode: 'BP12', next: 'BP6' }
    }
}

export function getCodePrefix(code) {
    const match = code.match(/^[A-Z]+/)
    return match ? match[0] : ''
}

export function isLrtLine(lineCode) {
    return LRT_LINES.includes(lineCode)
}

export function shouldConnectSequentially(prevCode, currCode, lineCode) {
    const groups = linePrefixGroups[lineCode]
    if (!groups) return true

    const prevPrefix = getCodePrefix(prevCode)
    const currPrefix = getCodePrefix(currCode)
    for (const group of groups) {
        if (group.includes(prevPrefix) && group.includes(currPrefix)) return true
    }
    return false
}
