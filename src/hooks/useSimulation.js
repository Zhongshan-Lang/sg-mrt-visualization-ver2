import { useRef, useState, useCallback } from 'react'
import { TrainSystem } from '../systems/train/trainSystem'

const SPEED_OPTIONS = [0.5, 1, 2, 4]

export function useSimulation(mapRef, mrtData) {
    const trainSystemRef = useRef(null)
    const runningRef = useRef(false)
    const [isSimulationRunning, setIsSimulationRunning] = useState(false)
    const [showTrains, setShowTrains] = useState(false)
    const [simSpeed, setSimSpeed] = useState(1)
    const [selectedTrain, setSelectedTrain] = useState(null)

    const initSimulation = useCallback(() => {
        if (!mapRef.current || !mrtData || trainSystemRef.current) return
        trainSystemRef.current = new TrainSystem(mapRef.current, mrtData)
        trainSystemRef.current.setVisible(false)
        trainSystemRef.current.onTrainSelect = setSelectedTrain
    }, [mapRef, mrtData])

    const startSimulation = useCallback(() => {
        if (!mapRef.current || !mrtData) return
        if (!trainSystemRef.current) {
            trainSystemRef.current = new TrainSystem(mapRef.current, mrtData)
        }
        trainSystemRef.current.onTrainSelect = setSelectedTrain
        trainSystemRef.current.start()
        runningRef.current = true
        setIsSimulationRunning(true)
        setShowTrains(true)
        trainSystemRef.current.setVisible(true)
    }, [mapRef, mrtData])

    const toggleSimulation = useCallback(() => {
        if (runningRef.current) {
            trainSystemRef.current?.stop()
            runningRef.current = false
            setIsSimulationRunning(false)
        } else {
            if (!mapRef.current || !mrtData) return
            if (!trainSystemRef.current) {
                trainSystemRef.current = new TrainSystem(mapRef.current, mrtData)
            }
            trainSystemRef.current.start()
            runningRef.current = true
            setIsSimulationRunning(true)
            setShowTrains(true)
            trainSystemRef.current.setVisible(true)
        }
    }, [mrtData, mapRef])

    const cycleSpeed = useCallback(() => {
        setSimSpeed(prev => {
            const idx = SPEED_OPTIONS.indexOf(prev)
            const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length]
            if (trainSystemRef.current) trainSystemRef.current.setSpeed(next)
            return next
        })
    }, [])

    const toggleTrainVisibility = useCallback(() => {
        setShowTrains(prev => {
            const next = !prev
            if (trainSystemRef.current) trainSystemRef.current.setVisible(next)
            return next
        })
    }, [])

    const cleanupSimulation = useCallback(() => {
        if (trainSystemRef.current) {
            trainSystemRef.current.stop()
            trainSystemRef.current = null
        }
        runningRef.current = false
    }, [])

    const getArrivals = useCallback((stationCode) => {
        return trainSystemRef.current ? trainSystemRef.current.getArrivals(stationCode) : []
    }, [])

    return {
        isSimulationRunning,
        showTrains,
        simSpeed,
        selectedTrain,
        setSelectedTrain,
        toggleSimulation,
        toggleTrainVisibility,
        getArrivals,
        cycleSpeed,
        startSimulation,
        initSimulation,
        cleanupSimulation
    }
}
