import { useEffect } from 'react'

export function useCloseOnEscape(closePanel, closeLinePanel) {
    useEffect(() => {
        function handleKeyDown(e) {
            if (e.key === 'Escape') {
                closePanel()
                closeLinePanel()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [closePanel, closeLinePanel])
}