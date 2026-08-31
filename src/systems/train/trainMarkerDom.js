const DEFAULT_TRAIN_DOT_SIZE = 10
const TRACKED_TRAIN_DOT_SIZE = 16

export function createTrainMarkerDom({ trainIndex }) {
    const el = document.createElement('div')
    el.style.width = '0px'
    el.style.height = '0px'
    el.style.pointerEvents = 'auto'
    el.style.overflow = 'visible'

    const bodyEl = document.createElement('div')
    bodyEl.style.width = '20px'
    bodyEl.style.height = '20px'
    bodyEl.style.borderRadius = '50%'
    bodyEl.style.background = 'transparent'
    bodyEl.style.boxShadow = 'none'
    bodyEl.style.opacity = '0'
    bodyEl.style.transformOrigin = 'center center'
    bodyEl.style.willChange = 'width, height'
    bodyEl.style.cursor = 'pointer'
    bodyEl.style.position = 'absolute'
    bodyEl.style.left = '0'
    bodyEl.style.top = '0'
    bodyEl.style.pointerEvents = 'auto'
    el.appendChild(bodyEl)

    el.setAttribute('data-train-idx', trainIndex)
    bodyEl.setAttribute('data-train-idx', trainIndex)

    const syncMarkerSize = (train) => {
        const size = train.isTracked ? TRACKED_TRAIN_DOT_SIZE : DEFAULT_TRAIN_DOT_SIZE
        bodyEl.style.width = `${size.toFixed(1)}px`
        bodyEl.style.height = `${size.toFixed(1)}px`
        bodyEl.style.borderRadius = '50%'
        bodyEl.style.transform = `translate(${-size / 2}px, ${-size / 2}px)`
        bodyEl.style.zIndex = train.isTracked ? '8' : '4'
    }

    return { el, bodyEl, syncMarkerSize }
}
