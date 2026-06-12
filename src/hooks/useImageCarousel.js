import { useEffect, useState } from 'react'
import { loadStationImages } from '../data/loaders/stationImages'

export function useImageCarousel(selectedStation) {
    const [currentImage, setCurrentImage] = useState(0)
    const [isImageHovered, setIsImageHovered] = useState(false)
    const [images, setImages] = useState([])

    useEffect(() => {
        setCurrentImage(0)
        setImages([])
        if (!selectedStation) return

        let cancelled = false
        loadStationImages(selectedStation.name).then(loadedImages => {
            if (!cancelled) setImages(loadedImages)
        })

        return () => { cancelled = true }
    }, [selectedStation?.station_codes, selectedStation?.name])

    useEffect(() => {
        if (!selectedStation) return
        if (images.length <= 1) return
        if (isImageHovered) return

        const timer = setInterval(() => {
            setCurrentImage(prev =>
                prev === images.length - 1 ? 0 : prev + 1
            )
        }, 3250)

        return () => clearInterval(timer)
    }, [currentImage, selectedStation, isImageHovered, images])

    return { currentImage, setCurrentImage, isImageHovered, setIsImageHovered, images }
}