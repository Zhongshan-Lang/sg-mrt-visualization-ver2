export function isTrain3dPrototypeEnabled(search = window.location.search) {
    return new URLSearchParams(search).get('train3d') !== '0'
}