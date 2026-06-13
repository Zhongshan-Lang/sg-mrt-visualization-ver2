import { useEffect, useState } from 'react'
import { loadRailData } from '../data/loaders/railData'

export function useRailData() {
    const [mrtData, setMrtData] = useState(null)

    useEffect(() => {
        let cancelled = false

        loadRailData()
            .then(data => {
                if (!cancelled) setMrtData(data)
            })
            .catch(error => {
                console.error(error)
            })

        return () => {
            cancelled = true
        }
    }, [])

    return mrtData
}
