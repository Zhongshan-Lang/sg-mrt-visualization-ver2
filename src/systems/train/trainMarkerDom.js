const DEFAULT_TRAIN_SIZE = { width: 11, length: 23, elevation: 3 }
const TRACKED_TRAIN_SIZE = { width: 15, length: 31, elevation: 4 }

function mixColor(hex, target, amount) {
    const value = hex.replace('#', '')
    if (!/^[0-9a-f]{6}$/i.test(value)) return hex

    const channels = [0, 2, 4].map(offset => {
        const source = Number.parseInt(value.slice(offset, offset + 2), 16)
        return Math.round(source + (target - source) * amount)
            .toString(16)
            .padStart(2, '0')
    })

    return `#${channels.join('')}`
}

export function createTrainMarkerDom({ color, trainIndex }) {
    const el = document.createElement('div')
    el.style.width = '0px'
    el.style.height = '0px'
    el.style.pointerEvents = 'auto'
    el.style.overflow = 'visible'

    const bodyEl = document.createElement('div')
    bodyEl.style.opacity = '1'
    bodyEl.style.transformOrigin = 'center center'
    bodyEl.style.willChange = 'width, height, transform'
    bodyEl.style.cursor = 'pointer'
    bodyEl.style.position = 'absolute'
    bodyEl.style.left = '0'
    bodyEl.style.top = '0'
    bodyEl.style.pointerEvents = 'auto'

    const sideEl = document.createElement('div')
    sideEl.style.position = 'absolute'
    sideEl.style.background = mixColor(color, 0, 0.42)
    sideEl.style.border = `1px solid ${mixColor(color, 0, 0.58)}`
    sideEl.style.borderRadius = '2px'
    sideEl.style.boxSizing = 'border-box'
    sideEl.style.boxShadow = '0 2px 4px rgba(0,0,0,0.36)'
    sideEl.style.pointerEvents = 'none'

    const roofEl = document.createElement('div')
    roofEl.style.position = 'absolute'
    roofEl.style.background = mixColor(color, 255, 0.30)
    roofEl.style.border = `1px solid ${mixColor(color, 255, 0.48)}`
    roofEl.style.borderRadius = '2px'
    roofEl.style.boxSizing = 'border-box'
    roofEl.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.35)'
    roofEl.style.pointerEvents = 'none'

    const windowsEl = document.createElement('div')
    windowsEl.style.position = 'absolute'
    windowsEl.style.background = 'rgba(13, 28, 43, 0.72)'
    windowsEl.style.border = '1px solid rgba(255,255,255,0.24)'
    windowsEl.style.borderRadius = '1px'
    windowsEl.style.boxSizing = 'border-box'
    windowsEl.style.pointerEvents = 'none'

    const frontEl = document.createElement('div')
    frontEl.style.position = 'absolute'
    frontEl.style.background = mixColor(color, 0, 0.22)
    frontEl.style.borderTop = '1px solid rgba(255,255,255,0.22)'
    frontEl.style.borderRadius = '0 0 2px 2px'
    frontEl.style.boxSizing = 'border-box'
    frontEl.style.pointerEvents = 'none'

    roofEl.appendChild(windowsEl)
    sideEl.appendChild(frontEl)
    bodyEl.append(sideEl, roofEl)
    el.appendChild(bodyEl)

    el.setAttribute('data-train-idx', trainIndex)
    bodyEl.setAttribute('data-train-idx', trainIndex)

    const syncMarkerSize = (train) => {
        const { width, length, elevation } = train.isTracked ? TRACKED_TRAIN_SIZE : DEFAULT_TRAIN_SIZE
        const roofWidth = width - elevation
        const roofLength = length - elevation

        bodyEl.style.width = `${width}px`
        bodyEl.style.height = `${length}px`
        bodyEl.style.transform = `translate(${-width / 2}px, ${-length / 2}px)`

        sideEl.style.left = `${elevation}px`
        sideEl.style.top = `${elevation}px`
        sideEl.style.width = `${roofWidth}px`
        sideEl.style.height = `${roofLength}px`

        roofEl.style.left = '0px'
        roofEl.style.top = '0px'
        roofEl.style.width = `${roofWidth}px`
        roofEl.style.height = `${roofLength}px`

        windowsEl.style.left = `${Math.max(1, roofWidth * 0.2)}px`
        windowsEl.style.top = `${Math.max(2, roofLength * 0.18)}px`
        windowsEl.style.width = `${Math.max(3, roofWidth * 0.6)}px`
        windowsEl.style.height = `${Math.max(5, roofLength * 0.46)}px`

        frontEl.style.left = '0px'
        frontEl.style.bottom = '0px'
        frontEl.style.width = '100%'
        frontEl.style.height = `${Math.max(3, roofLength * 0.2)}px`

        bodyEl.style.zIndex = train.isTracked ? '8' : '4'
    }

    return { el, bodyEl, syncMarkerSize }
}
