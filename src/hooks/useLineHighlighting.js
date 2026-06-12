import { useEffect } from 'react'

function getSafeActiveLines(hoveredLines, selectedLines) {
    return [...new Set([...hoveredLines, ...selectedLines])].filter(
        line => typeof line === 'string' && line.length > 0
    )
}

export function applyLineHighlighting(map, hoveredLines, selectedLines, routeResult) {
    const safeHoveredLines = getSafeActiveLines(hoveredLines, selectedLines)

    if (routeResult) {
        if (safeHoveredLines.length > 0 && map?.getLayer('mrt-line-layer')) {
            map.setPaintProperty('mrt-line-layer', 'line-opacity', [
                'case',
                ['in', ['get', 'code'], ['literal', safeHoveredLines]],
                1, 0.15
            ])
        } else if (map?.getLayer('mrt-line-layer')) {
            map.setPaintProperty('mrt-line-layer', 'line-opacity', 0.15)
        }
        return
    }

    if (!map?.isStyleLoaded?.()) return
    if (!map.getLayer('mrt-line-layer')) return

    map.setPaintProperty('mrt-line-layer', 'line-opacity', [
        'case',
        ['in', ['get', 'code'], ['literal', safeHoveredLines]],
        1,
        safeHoveredLines.length > 0 ? 0.15 : 1
    ])

    map.setFilter('mrt-line-hover', [
        'all',
        ['!=', ['get', 'type'], 'subway'],
        ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
        ['in', ['get', 'code'], ['literal', safeHoveredLines]]
    ])

    map.setPaintProperty('mrt-line-hover', 'line-opacity',
        safeHoveredLines.length > 0 ? 1 : 0
    )
}

export function useLineHighlighting({ mapRef, hoveredLines, selectedLines, routeResultRef }) {
    useEffect(() => {
        applyLineHighlighting(
            mapRef.current,
            hoveredLines,
            selectedLines,
            routeResultRef.current
        )
    }, [hoveredLines, mapRef, routeResultRef, selectedLines])
}
