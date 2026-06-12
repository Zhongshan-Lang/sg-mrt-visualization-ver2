import { useCallback } from 'react'
import { lineColors, stationLineToActualCode, transferPolygonLineOrder } from '../../config'
import { terminalStationCodes } from '../../data/generated/lineIndex'
import { findBuildingLayer } from './mapLayerOrdering'

const terminalStationCodeSet = new Set(terminalStationCodes)

export function useMapLayers(mapRef, mrtData, onMapLoaded) {
    const initializeLayers = useCallback(() => {
        if (!mapRef.current) return

        // 涓?feature 娣诲姞 code 鍜?color
        enrichFeatures(mrtData)

        // Add MRT source
        mapRef.current.addSource('mrt-line', {
            type: 'geojson',
            data: mrtData
        })


        // Add all map layers
        addAllLayers(mapRef.current, mrtData)


        //==============================================================
        // ========== 馃憞 鑷畾涔?3D 寤虹瓚鍥惧眰锛堝凡娉ㄩ噴锛屾敼鐢?MapTiler 寤虹瓚锛?=========

        // // 娣诲姞寤虹瓚鏁版嵁婧?        // mapRef.current.addSource('buildings-3d', {
        //     type: 'geojson',
        //     data: '/data/more-buildings.geojson'
        // })
        //
        // // 娣诲姞 3D 寤虹瓚鍥惧眰
        // mapRef.current.addLayer({
        //     id: 'buildings-3d-layer',
        //     type: 'fill-extrusion',
        //     source: 'buildings-3d',
        //     minzoom: 11,
        //     paint: {
        //         'fill-extrusion-color': [
        //             'match',
        //             ['get', 'building'],
        //             'apartments', '#C9AE8C',
        //             'residential', '#A89070',
        //             'commercial', '#7A9E9E',
        //             'office', '#6A8E8E',
        //             'hotel', '#9E8A7A',
        //             'industrial', '#8E8A7A',
        //             'public', '#6A8EAE',
        //             'school', '#5A7E9E',
        //             'hospital', '#D47A7A',
        //             'religious', '#C4A87A',
        //             'transportation', '#6A8A8A',
        //             '#999999'
        //         ],
        //         'fill-extrusion-height': [
        //             'case',
        //             ['all', ['has', 'height'], ['>', ['to-number', ['get', 'height'], 0], 0]],
        //             ['to-number', ['get', 'height'], 10],
        //             ['all', ['has', 'building:levels'], ['>', ['to-number', ['get', 'building:levels'], 0], 0]],
        //             ['*', ['to-number', ['get', 'building:levels'], 3], 3],
        //             15
        //         ],
        //         'fill-extrusion-base': 0,
        //         'fill-extrusion-opacity': 0.85,
        //         'fill-extrusion-vertical-gradient': true
        //     }
        // });

        //====================================================================

        // // 鎶妉abel鍥惧眰绉诲埌鑷畾涔夊缓绛戜笂闈?        // if (mapRef.current.getLayer('buildings-3d-layer')) {
        //     mapRef.current.moveLayer('station-labels')
        //     mapRef.current.moveLayer('entrance-labels')
        // }


        onMapLoaded?.()
    }, [mapRef, mrtData, onMapLoaded])

    return { initializeLayers }
}

function enrichFeatures(mrtData) {
    const transferCounters = {}
    mrtData.features.forEach(feature => {
        // Add code for line features
        if ((feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') && !feature.properties.code) {
            const name = feature.properties.name || ''
            if (name.includes('North South')) feature.properties.code = 'NS'
            else if (name.includes('East West')) feature.properties.code = 'EW'
            else if (name.includes('North East')) feature.properties.code = 'NE'
            else if (name.includes('Circle')) feature.properties.code = 'CC'
            else if (name.includes('Downtown')) feature.properties.code = 'DT'
            else if (name.includes('Thomson-East Coast')) feature.properties.code = 'TE'
            else if (name.includes('Bukit Panjang')) feature.properties.code = 'BP'
            else if (name.includes('Sengkang')) feature.properties.code = 'SE'
            else if (name.includes('Punggol')) feature.properties.code = 'PE'
        }

        // 娣诲姞 color
        if (!feature.properties.color) {
            if (feature.properties.line_color) {
                feature.properties.color = feature.properties.line_color
            } else if (feature.properties.station_colors) {
                const colorMap = {
                    'red': '#d42e12', 'green': '#009645', 'purple': '#9900aa',
                    'yellow': '#fa9e0d', 'blue': '#005ec4', 'brown': '#9D5B25',
                    'gray': '#808080', 'orange': '#ff8c00',
                    'blue-yellow': '#005ec4', 'red-green': '#d42e12',
                }
                feature.properties.color = colorMap[feature.properties.station_colors] || '#808080'
            } else {
                const codes = feature.properties.station_codes || ''
                const firstCode = codes.split('-')[0]
                if (firstCode) {
                    const prefix = firstCode.match(/[A-Z]+/)?.[0]
                    const actualCode = stationLineToActualCode[prefix] || prefix
                    feature.properties.color = lineColors[actualCode] || '#808080'
                } else {
                    feature.properties.color = '#808080'
                }
            }
        }

        if (feature.geometry.type === 'Point' && feature.properties.station_codes) {
            const codes = (feature.properties.station_codes || '').split('-')
            feature.properties.is_terminal_station = codes.some(code => terminalStationCodeSet.has(code))
        }

        // Assign fill_color / outline_color for line features AND station concourse polygons
        if ((feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString' ||
             feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') && !feature.properties.code) {
            const codes = (feature.properties.station_codes || '').split('-')
            if (codes.length === 1) {
                // Single-line station uses its line color
                const prefix = codes[0].match(/[A-Z]+/)?.[0]
                const actualCode = stationLineToActualCode[prefix] || prefix
                const color = lineColors[actualCode] || '#808080'
                feature.properties.fill_color = color
                feature.properties.outline_color = color
                feature.properties.is_transfer = false
            } else {
                // 鎹箻绔?鈫?姣忎釜 Polygon 鍒嗛厤涓嶅悓绾胯矾棰滆壊
                feature.properties.is_transfer = true
                const key = feature.properties.station_codes
                const count = transferCounters[key] || 0
                transferCounters[key] = count + 1
                // 浼樺厛浣跨敤鎵嬪姩瑕嗙洊閰嶇疆
                const override = transferPolygonLineOrder[key]
                let prefix
                if (override && count < override.length) {
                    prefix = override[count]
                } else if (count < codes.length) {
                    prefix = codes[count].match(/[A-Z]+/)?.[0]
                } else {
                    prefix = codes[codes.length - 1].match(/[A-Z]+/)?.[0]
                }
                const actualCode = stationLineToActualCode[prefix] || prefix
                const color = lineColors[actualCode] || '#808080'
                feature.properties.fill_color = color
                feature.properties.outline_color = color
            }
        }
    })
}

function addAllLayers(map, mrtData) {
    const stationPointFilter = ['all',
        ['==', ['geometry-type'], 'Point'],
        ['!=', ['get', 'stop_type'], 'entrance'],
        ['!=', ['get', 'type'], 'subway']
    ]
    const importantStationExpression = ['any',
        ['>', ['coalesce', ['get', 'network_count'], 1], 1],
        ['==', ['get', 'is_terminal_station'], true]
    ]
    const transferStationFilter = [
        ...stationPointFilter,
        importantStationExpression
    ]
    const localStationFilter = [
        ...stationPointFilter,
        ['!', importantStationExpression]
    ]

    // ========== 馃攩 娣诲姞鍏ㄥ眬鍏夌収锛堣 3D 寤虹瓚闃村奖鏇存槑鏄撅級==========
    /*map.setLight({
        anchor: 'map',
        position: [1.5, 90, 30],  // 鍏夋簮鏂瑰悜锛氭潵鑷笢鍋忓寳锛?0搴﹁
        intensity: 0.8,
        color: 'white'
    });*/
    // ========================================================


    // Insert station interior below building layer so it renders under buildings.
    // Fallback: if no building layer found, add on top (visible but might overlap buildings).
    const buildingBeforeId = findBuildingLayer(map) || undefined

    // Station interior — 2D fill renders after 3D buildings, visible through semi-transparent ones
    map.addLayer({
        id: 'station-interior',
        type: 'fill',
        source: 'mrt-line',
        minzoom: 15,
        filter: ['all',
            ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
            ['==', ['get', 'type'], 'subway']
        ],
        paint: {
            'fill-color': ['get', 'fill_color'],
            'fill-opacity': 0.28,
            'fill-opacity-transition': { duration: 400 },
            'fill-outline-color': [
                'case',
                ['has', 'outline_color'], ['get', 'outline_color'],
                ['get', 'fill_color']
            ]
        }
    }, buildingBeforeId)

    // Station interior outline
    map.addLayer({
        id: 'station-interior-outline',
        type: 'line',
        source: 'mrt-line',
        minzoom: 15,
        filter: ['all',
            ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
            ['==', ['get', 'type'], 'subway']
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
            'line-color': ['get', 'outline_color'],
            'line-width': 1.5,
            'line-opacity': 0.5
        }
    }, buildingBeforeId)

    // 涓荤嚎璺眰
    map.addLayer({
        id: 'mrt-line-layer',
        type: 'line',
        source: 'mrt-line',
        filter: ['all', ['!=', ['get', 'type'], 'subway'], ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
            'line-color': ['get', 'color'],
            'line-opacity': 1,
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 12, 4, 14, 6, 16, 10, 18, 18]
        }
    })

    // Line hover layer
    map.addLayer({
        id: 'mrt-line-hover',
        type: 'line',
        source: 'mrt-line',
        filter: ['==', ['get', 'code'], ''],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
            'line-color': ['get', 'color'],
            'line-opacity': 0,
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 12, 5, 14, 8, 16, 12, 18, 24],
            'line-blur': 0.5
        }
    })

    map.addLayer({
        id: 'station-glow',
        type: 'circle',
        source: 'mrt-line',
        minzoom: 10,
        filter: transferStationFilter,
        paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'],
                10, 8,
                12, 12,
                14, 18,
                16, 28,
                18, 42
            ],
            'circle-color': '#ffffff',
            'circle-opacity': 0.15,
            'circle-blur': 1
        }
    })

    map.addLayer({
        id: 'station-core',
        type: 'circle',
        source: 'mrt-line',
        minzoom: 10,
        filter: transferStationFilter,
        paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'],
                10, 2.8,
                12, 4.4,
                14, 6.2,
                16, 8.8,
                18, 13
            ],
            'circle-color': '#ffffff',
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#000000'
        }
    })

    map.addLayer({
        id: 'station-glow-local',
        type: 'circle',
        source: 'mrt-line',
        minzoom: 13.2,
        filter: localStationFilter,
        paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'],
                13.2, 9,
                14, 14,
                16, 22,
                18, 33
            ],
            'circle-color': '#ffffff',
            'circle-opacity': ['interpolate', ['linear'], ['zoom'], 13.2, 0, 14, 0.12, 16, 0.15],
            'circle-blur': 1
        }
    })

    map.addLayer({
        id: 'station-core-local',
        type: 'circle',
        source: 'mrt-line',
        minzoom: 13.2,
        filter: localStationFilter,
        paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'],
                13.2, 3.1,
                14, 4.6,
                16, 6.6,
                18, 9.6
            ],
            'circle-color': '#ffffff',
            'circle-opacity': ['interpolate', ['linear'], ['zoom'], 13.2, 0, 13.8, 1],
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#000000'
        }
    })

    map.addLayer({
        id: 'station-labels',
        type: 'symbol',
        source: 'mrt-line',
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['!=', ['get', 'stop_type'], 'entrance'], ['!=', ['get', 'type'], 'subway']],
        layout: {
            'text-field': ['format', ['get', 'name'], { 'font-scale': 1.0 }, '\n', {}, ['get', 'name_zh'], { 'font-scale': 0.9 }],
            'text-font': ['Noto Sans Tamil Regular', 'Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 8, 0, 10, 8, 12, 10, 14, 13, 16, 16, 18, 22, 20, 30],
            'text-line-height': 1.6,
            'text-offset': [0, 1.5],
            'text-anchor': 'top',
            'symbol-z-order': 'viewport-y'
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1,
            'text-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0, 10, 0.3, 12, 0.6, 14, 1, 16, 0.8, 18, 0.4, 20, 0]
        }
    })

    // 鍑哄彛鍥惧眰
    map.addLayer({
        id: 'station-entrance',
        type: 'circle',
        source: 'mrt-line',
        minzoom: 15.5,
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'stop_type'], 'entrance']],
        paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 3, 16, 4.5, 18, 7],
            'circle-color': '#ffffff',
            'circle-opacity': 0.6,
            'circle-stroke-width': 1,
            'circle-stroke-color': '#000000'
        }
    })

    map.addLayer({
        id: 'entrance-labels',
        type: 'symbol',
        source: 'mrt-line',
        minzoom: 15.5,
        filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', ['get', 'stop_type'], 'entrance']],
        layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Noto Sans Tamil Regular', 'Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 15, 0, 16, 9, 18, 13],
            'text-offset': [0, 1.2],
            'text-anchor': 'top'
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 0.8,
            'text-opacity': 0.7
        }
    })

    map.addLayer({
        id: 'mrt-line-glow',
        type: 'line',
        source: 'mrt-line',
        filter: ['all', ['!=', ['get', 'type'], 'subway'], ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
            'line-color': ['get', 'color'],
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 6, 12, 10, 14, 14, 16, 22, 18, 36],
            'line-opacity': 0.22,
            'line-blur': ['interpolate', ['linear'], ['zoom'], 10, 3, 14, 6, 18, 12]
        }
    })

    // Prebuild route highlight source and layer
    const hSrc = 'route-highlight-src'
    if (!map.getSource(hSrc)) {
        map.addSource(hSrc, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    }
    const flowSrc = 'route-flow-src'
    if (!map.getSource(flowSrc)) {
        map.addSource(flowSrc, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
    }
    if (!map.getLayer('route-glow')) {
        map.addLayer({
            id: 'route-glow', type: 'line', source: hSrc,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': ['get', 'color'],
                'line-width': ['interpolate', ['linear'], ['zoom'], 10, 12, 14, 22, 18, 40],
                'line-opacity': 0.25,
                'line-blur': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 8, 18, 16]
            }
        })
    }
    if (!map.getLayer('route-highlight-layer')) {
        map.addLayer({
            id: 'route-highlight-layer', type: 'line', source: hSrc,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': ['get', 'color'],
                'line-width': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 10, 18, 20],
                'line-opacity': 0.9
            }
        })
    }
    if (!map.getLayer('route-flow-layer')) {
        map.addLayer({
            id: 'route-flow-layer', type: 'line', source: flowSrc,
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
                'line-color': '#ffffff',
                'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 14, 3, 18, 5.5],
                'line-opacity': 0,
                'line-blur': 0.35
            }
        })
    }

    // Keep station-interior below building regardless of later layer reordering
    const bldgId = findBuildingLayer(map)
    if (bldgId) {
        if (map.getLayer('station-interior')) map.moveLayer('station-interior', bldgId)
        if (map.getLayer('station-interior-outline')) map.moveLayer('station-interior-outline', bldgId)
    }
}

