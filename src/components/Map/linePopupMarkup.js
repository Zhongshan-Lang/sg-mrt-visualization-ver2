export function buildLinePopupHTML(props, t) {
    return `
        <div style="padding:16px 20px;background:${t.popupBg};backdrop-filter:blur(22px);border-radius:18px;color:${t.textPrimary};font-family:sans-serif;min-width:220px;border:1px solid ${t.borderMedium};box-shadow:${t.shadowPopupLine};">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:16px;height:16px;border-radius:999px;background:${props.color};"></div>
            <div style="font-size:18px;font-weight:700;">${props.code}</div>
          </div>
          <div style="margin-top:8px;font-size:15px;opacity:0.82;">${props.name}</div>
        </div>
      `
}
