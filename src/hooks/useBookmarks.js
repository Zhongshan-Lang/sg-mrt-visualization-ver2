import { useState, useCallback } from 'react'

export function useBookmarks() {
    const [bookmarks, setBookmarks] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('mrt-bookmarks') || '[]')
        } catch {
            return []
        }
    })

    const toggleBookmark = useCallback((stationCode) => {
        setBookmarks(prev => {
            const next = prev.includes(stationCode)
                ? prev.filter(c => c !== stationCode)
                : [...prev, stationCode]
            localStorage.setItem('mrt-bookmarks', JSON.stringify(next))
            return next
        })
    }, [])

    return { bookmarks, toggleBookmark }
}