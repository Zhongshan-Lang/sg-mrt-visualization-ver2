import * as turf from '@turf/turf'

export function computeTrainHeading(train, fallbackBearing) {
    try {
        const feature = train.route?.feature
        if (!feature) throw new Error('no route')

        let coords = feature.geometry.coordinates
        if (feature.geometry.type === 'MultiLineString') {
            coords = coords[0]
        }

        const line = turf.lineString(coords)
        const epsilon = 0.001
        const distance = train.distance
        const lineLength = turf.length(line)
        const d1 = Math.max(0, distance - epsilon)
        const d2 = Math.min(lineLength, distance + epsilon)
        const start = turf.along(line, d1).geometry.coordinates
        const end = turf.along(line, d2).geometry.coordinates

        return turf.bearing(turf.point(start), turf.point(end))
    } catch {
        return fallbackBearing
    }
}
