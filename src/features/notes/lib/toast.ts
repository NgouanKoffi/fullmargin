export type ToastKind = "info" | "success" | "error" | "warning";

/** Petit toast en haut-droit (icône SVG, pas d'emoji) */
export function toast(msg: string, kind: ToastKind = "info", ms = 1600) {
  const wrap = document.createElement("div");
  const icon = document.createElement("span");
  const text = document.createElement("span");

  wrap.style.cssText = [
    "position:fixed;right:16px;top:16px;z-index:2147483647;",
    "background:#fff;color:#111827;border:1px solid rgba(0,0,0,0.2);",
    "border-radius:12px;padding:10px 12px;font-size:13px;display:flex;align-items:center;gap:8px;",
    "box-shadow:0 8px 20px rgba(0,0,0,0.12);",
  ].join("");

  const color =
    kind === "success"
      ? "#16a34a"
      : kind === "error"
      ? "#dc2626"
      : kind === "warning"
      ? "#d97706"
      : "#374151";

  icon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
       <circle cx="12" cy="12" r="9" stroke="${color}" stroke-width="2"/>
       <path d="M12 8v4m0 4h.01" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
     </svg>`;

  text.textContent = msg;
  wrap.append(icon, text);
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), ms);
}
