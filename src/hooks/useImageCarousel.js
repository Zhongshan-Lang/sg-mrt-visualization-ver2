import { useEffect, useState } from 'react'
import { loadStationImages } from '../data/loaders/stationImages'

export function useImageCarousel(selectedStation) {
    const [currentImage, setCurrentImage] = useState(0)
    const [isImageHovered, setIsImageHovered] = useState(false)
    const [images, setImages] = useState([])
    const stationCodes = selectedStation?.station_codes || ''
    const stationName = selectedStation?.name || ''

    useEffect(() => {
        if (!stationName) return

        let cancelled = false
        loadStationImages(stationName)
            .then(loadedImages => {
                if (!cancelled) {
                    setImages(loadedImages)
                    setCurrentImage(0)
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setImages([])
                    setCurrentImage(0)
                }
            })

        return () => { cancelled = true }
    }, [stationCodes, stationName])

    useEffect(() => {
        if (!stationCodes) return
        if (images.length <= 1) return
        if (isImageHovered) return

        const timer = setInterval(() => {
            setCurrentImage(prev =>
                prev === images.length - 1 ? 0 : prev + 1
            )
        }, 3250)

        return () => clearInterval(timer)
    }, [images, isImageHovered, stationCodes])

    return { currentImage, setCurrentImage, isImageHovered, setIsImageHovered, images }
}
