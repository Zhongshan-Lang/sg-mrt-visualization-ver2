import { useRef, useState, useCallback } from 'react'
import { TrainSystem } from '../systems/train/trainSystem'

const SPEED_OPTIONS = [0.5, 1, 2, 4]

export function useSimulation(mapRef, mrtData) {
    const trainSystemRef = useRef(null)
    const runningRef = useRef(false)
    const showTrainsRef = useRef(false)
    const networkVisibleRef = useRef(true)
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
        showTrainsRef.current = true
        setShowTrains(true)
        trainSystemRef.current.setVisible(networkVisibleRef.current)
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
            showTrainsRef.current = true
            setShowTrains(true)
            trainSystemRef.current.setVisible(networkVisibleRef.current)
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
            showTrainsRef.current = next
            if (trainSystemRef.current) trainSystemRef.current.setVisible(next && networkVisibleRef.current)
            return next
        })
    }, [])

    const setNetworkVisibility = useCallback((visible) => {
        networkVisibleRef.current = visible
        if (trainSystemRef.current) {
            trainSystemRef.current.setVisible(visible && showTrainsRef.current)
        }
    }, [])

    const cleanupSimulation = useCallback(() => {
        if (trainSystemRef.current) {
            trainSystemRef.current.destroy()
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
        setNetworkVisibility,
        getArrivals,
        cycleSpeed,
        startSimulation,
        initSimulation,
        cleanupSimulation
    }
}
