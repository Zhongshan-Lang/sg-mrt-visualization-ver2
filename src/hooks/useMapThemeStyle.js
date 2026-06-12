import { useEffect } from 'react'

export function useMapThemeStyle({
    theme,
    t,
    mapRef,
    mapLoadedRef,
    mapStyleUrl,
    initMapFeatures
}) {
    useEffect(() => {
        document.documentElement.style.setProperty('--scroll-thumb', t.overlayScrollThumb)
        document.documentElement.style.setProperty('--scroll-thumb-hover', t.overlayScrollThumbHover)

        if (!mapRef.current || !mapLoadedRef.current) return
        mapRef.current.setStyle(mapStyleUrl)
        mapRef.current.once('style.load', initMapFeatures)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme])
}
