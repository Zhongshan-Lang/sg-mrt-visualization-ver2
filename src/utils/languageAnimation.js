export const languageTransition = 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1), filter 0.45s cubic-bezier(0.22,1,0.36,1)'

export function languageTextStyle(labelOpacity, opacity = labelOpacity, offset = 4, scale = 0.95, blur = 4) {
    return {
        opacity,
        transition: languageTransition,
        transform: labelOpacity === 0 ? `translateY(${offset}px) scale(${scale})` : 'translateY(0px) scale(1)',
        filter: labelOpacity === 0 ? `blur(${blur}px)` : 'blur(0px)'
    }
}
