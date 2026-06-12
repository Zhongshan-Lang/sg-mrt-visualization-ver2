export const animations = `
@keyframes panelEnter {
  from {
    opacity: 0;
    transform: translateX(40px) scale(0.96);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0px) scale(1);
    filter: blur(0px);
  }
}

@keyframes panelExit {
  0% {
    opacity: 1;
    transform: translateY(0px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-20px) scale(0.92);
  }
}

@keyframes popupEnter {
  0% {
    opacity: 0;
    transform: translateY(10px) scale(0.94);
  }
  100% {
    opacity: 1;
    transform: translateY(0px) scale(1);
  }
}

@keyframes popupExit {
  0% {
    opacity: 1;
    transform: translateY(0px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(8px) scale(0.92);
  }
}

@keyframes linePanelEnter {
  from {
    opacity: 0;
    transform: translateX(-40px) scale(0.96);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0px) scale(1);
    filter: blur(0px);
  }
}

@keyframes linePanelExit {
  0% {
    opacity: 1;
    transform: translateX(0px) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateX(-20px) scale(0.92);
  }
}

@keyframes scrollText {
  0% { transform: translateX(0); }
  10% { transform: translateX(0); }
  75% { transform: translateX(calc(-100% + 100px)); }
  90% { transform: translateX(calc(-100% + 100px)); }
  100% { transform: translateX(0); }
}

@keyframes scrollInlineText {
  0% { transform: translateX(0); }
  10% { transform: translateX(0); }
  75% { transform: translateX(calc(-100% + var(--scroll-container-width, 100px))); }
  90% { transform: translateX(calc(-100% + var(--scroll-container-width, 100px))); }
  100% { transform: translateX(0); }
}

@keyframes markerPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(1.5); }
}

@keyframes panelFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes panelFadeOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
  }
}

@keyframes guideBackdropIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes guideBackdropOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes guideModalIn {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.94);
    filter: blur(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes guideModalOut {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
  to {
    opacity: 0;
    transform: translateY(12px) scale(0.96);
    filter: blur(8px);
  }
}

@keyframes loadingSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes loadingFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes languageLockBreath {
  0%, 100% {
    box-shadow:
      0 0 0 1px var(--language-lock-glow-medium),
      0 0 6px var(--language-lock-glow-soft);
    filter: blur(0px);
  }
  50% {
    box-shadow:
      0 0 0 1px var(--language-lock-glow-strong),
      0 0 12px var(--language-lock-glow-medium),
      0 0 22px var(--language-lock-glow-soft);
    filter: blur(0.15px);
  }
}
`

export const globalStyles = `
.maplibregl-popup-content {
  background: transparent !important;
  padding: 0 !important;
  box-shadow: none !important;
}

.maplibregl-popup-tip {
  display: none !important;
}

.station-panel::-webkit-scrollbar {
  width: 4px;
}

.station-panel::-webkit-scrollbar-track {
  background: transparent;
}

.station-panel::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
  border-radius: 999px;
}

.station-panel::-webkit-scrollbar-thumb:hover {
  background: var(--scroll-thumb-hover);
}

.nav-scroll::-webkit-scrollbar {
  width: 4px;
}
.nav-scroll::-webkit-scrollbar-track {
  background: transparent;
}
.nav-scroll::-webkit-scrollbar-thumb {
  background: var(--scroll-thumb);
  border-radius: 999px;
}
.nav-scroll::-webkit-scrollbar-thumb:hover {
  background: var(--scroll-thumb-hover);
}
`
