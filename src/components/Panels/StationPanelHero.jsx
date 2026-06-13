import { useState } from 'react'

export default function StationPanelHero({
    displayImages,
    images,
    currentImage,
    onImageChange,
    isImageHovered,
    onImageHoverChange,
    t
}) {
    const [hoveredSide, setHoveredSide] = useState(null)

    return (
        <div
            onMouseEnter={() => onImageHoverChange?.(true)}
            onMouseLeave={() => onImageHoverChange?.(false)}
            style={{ position: 'relative' }}
        >
            <div style={{ width: '100%', height: '220px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                    position: 'absolute', bottom: 12, left: 0, right: 0,
                    display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 5
                }}>
                    {displayImages.map((_, index) => (
                        <div
                            key={index}
                            onClick={() => onImageChange?.(index)}
                            style={{
                                width: currentImage === index ? '22px' : '8px',
                                height: '8px',
                                borderRadius: '999px',
                                background: currentImage === index ? '#ffffff' : 'rgba(255,255,255,0.4)',
                                transition: '0.35s',
                                cursor: 'pointer'
                            }}
                        />
                    ))}
                </div>
                <div style={{
                    display: 'flex', width: `${displayImages.length * 100}%`,
                    transform: `translateX(-${currentImage * (100 / displayImages.length)}%)`,
                    transition: 'transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)'
                }}>
                    {displayImages.map((image, index) => (
                        <img
                            key={index}
                            src={image}
                            style={{
                                width: `${100 / displayImages.length}%`,
                                height: '220px',
                                objectFit: 'cover',
                                flexShrink: 0
                            }}
                        />
                    ))}
                </div>
            </div>
            <div style={{
                position: 'absolute', top: '90px', left: 0, right: 0,
                display: 'flex', justifyContent: 'space-between', padding: '0 12px',
                opacity: isImageHovered ? 1 : 0, transition: 'opacity 0.25s'
            }}>
                <button
                    onMouseEnter={() => setHoveredSide('prev')}
                    onMouseLeave={() => setHoveredSide(null)}
                    onClick={() => {
                        if (images.length <= 1) return
                        onImageChange?.(currentImage === 0 ? images.length - 1 : currentImage - 1)
                    }}
                    style={{
                        width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                        background: hoveredSide === 'prev' ? t.closeBtnBgHover : t.closeBtnBg,
                        backdropFilter: hoveredSide === 'prev' ? 'blur(12px)' : 'none',
                        color: 'white', cursor: 'pointer', fontSize: '22px', transition: '0.25s'
                    }}
                >❮</button>
                <button
                    onMouseEnter={() => setHoveredSide('next')}
                    onMouseLeave={() => setHoveredSide(null)}
                    onClick={() => {
                        if (images.length <= 1) return
                        onImageChange?.(currentImage === images.length - 1 ? 0 : currentImage + 1)
                    }}
                    style={{
                        width: '42px', height: '42px', borderRadius: '50%', border: 'none',
                        background: hoveredSide === 'next' ? t.closeBtnBgHover : t.closeBtnBg,
                        backdropFilter: hoveredSide === 'next' ? 'blur(12px)' : 'none',
                        color: 'white', cursor: 'pointer', fontSize: '22px', transition: '0.25s'
                    }}
                >❯</button>
            </div>
        </div>
    )
}
