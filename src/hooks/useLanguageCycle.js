import { useState, useEffect, useCallback, useRef } from 'react'

const languages = ['en', 'zh', 'ta']
const languageCycleMs = 8000
const languageFadeMs = 300

export function useLanguageCycle() {
    const [stationLabelLanguage, setStationLabelLanguage] = useState('en')
    const [labelOpacity, setLabelOpacity] = useState(1)
    const [isLanguageLocked, setIsLanguageLocked] = useState(false)
    const timerRef = useRef(null)
    const transitionRef = useRef(null)

    const clearTimers = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        if (transitionRef.current) clearTimeout(transitionRef.current)
        timerRef.current = null
        transitionRef.current = null
    }, [])

    const cycleLanguageNow = useCallback(() => {
        if (isLanguageLocked) return
        clearTimers()
        setLabelOpacity(0)
        transitionRef.current = setTimeout(() => {
            setStationLabelLanguage(prev => {
                const currentIndex = languages.indexOf(prev)
                return languages[(currentIndex + 1) % languages.length]
            })
            setLabelOpacity(1)
        }, languageFadeMs)
    }, [clearTimers, isLanguageLocked])

    const toggleLanguageLock = useCallback(() => {
        setIsLanguageLocked(prev => {
            const next = !prev
            if (next) {
                clearTimers()
                setLabelOpacity(1)
            }
            return next
        })
    }, [clearTimers])

    useEffect(() => {
        if (isLanguageLocked) {
            clearTimers()
            return undefined
        }

        timerRef.current = setTimeout(cycleLanguageNow, languageCycleMs)

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [clearTimers, cycleLanguageNow, isLanguageLocked, stationLabelLanguage])

    useEffect(() => clearTimers, [clearTimers])

    return {
        stationLabelLanguage,
        labelOpacity,
        cycleLanguageNow,
        isLanguageLocked,
        toggleLanguageLock
    }
}
