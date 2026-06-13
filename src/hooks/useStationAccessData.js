import { useEffect, useState } from 'react'
import { createEmptyStationAccessData, getStationAccessDataForStation } from '../data/loaders/stationAccessData'

export function useStationAccessData(stationCodes) {
    const [state, setState] = useState(() => createEmptyStationAccessData(stationCodes))

    useEffect(() => {
        if (!stationCodes) return

        let cancelled = false

        getStationAccessDataForStation(stationCodes).then(data => {
            if (!cancelled) setState(data)
        })

        return () => {
            cancelled = true
        }
    }, [stationCodes])

    return state.stationCodes === String(stationCodes || '')
        ? state
        : createEmptyStationAccessData(stationCodes)
}
