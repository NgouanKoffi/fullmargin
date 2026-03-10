// src/components/decor/AdminBackground.tsx
import React from "react";

export interface AdminBackgroundProps {
  /** Active/désactive le fond */
  enabled?: boolean;
  /** Taille de la tuile (px) : plus petit = plus dense */
  density?: number;
  /** Durée du pan (secondes) : plus grand = plus lent */
  speedSec?: number;
  /** Opacité globale du motif (0 → 1) */
  opacity?: number;
  /** Classes supplémentaires éventuelles (ex: pour du z-index spécifique) */
  className?: string;
  /** Style additionnel à fusionner */
  style?: React.CSSProperties;
}

/** Vars CSS personnalisées utilisées par le motif */
type AdminCSSVars = React.CSSProperties & {
  ["--admin-density"]?: string;
  ["--admin-speed"]?: string;
  ["--admin-opacity"]?: string;
};

/**
 * Fond admin “WhatsApp-like” (motif de points croisés + vignette radiale).
 * 100% CSS, theme-aware (variables), a11y OK (pointer-events:none, aria-hidden).
 */
export default function AdminBackground({
  enabled = true,
  density = 28,
  speedSec = 80,
  opacity = 0.5,
  className,
  style,
}: AdminBackgroundProps) {
  if (!enabled) return null;

  // Variables CSS consommées par le CSS global (.fm-admin-pattern / .fm-admin-vignette)
  const cssVars: AdminCSSVars = {
    "--admin-density": `${density}px`,
    "--admin-speed": `${speedSec}s`,
    "--admin-opacity": String(opacity),
  };

  return (
    <div
      aria-hidden="true"
      className={`fm-admin-bg fixed inset-0 z-0 pointer-events-none ${
        className ?? ""
      }`}
      style={{ ...cssVars, ...style }}
    >
      {/* couche motif (points croisés) */}
      <div className="fm-admin-pattern" />
      {/* voile radial pour éviter l’effet trop “plat” */}
      <div className="fm-admin-vignette" />
    </div>
  );
}
