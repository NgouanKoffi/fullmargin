// src/components/BackgroundFX.tsx
/**
 * Fond animé : orbes violets, grille qui défile & chandelles + badges de gains.
 * - pointer-events-none pour ne jamais capter les clics
 * - z-0 pour rester AU-DESSUS du body, mais sous ton contenu
 * - s’adapte au thème (utilise les variables CSS définies)
 */
export default function BackgroundFX() {
    // Petites chandelles qui montent (positionnées en % sur la largeur)
    const candles = [6, 18, 32, 46, 58, 72, 84];
  
    // Quelques gains/pertes pour l’ambiance (le CSS gère leurs positions/délais via nth-child)
    const gains = [
      { txt: "+58 $", pos: true },
      { txt: "+203 $", pos: true },
      { txt: "-47 $", pos: false },
      { txt: "+121 $", pos: true },
      { txt: "-28 $", pos: false },
      { txt: "+89 $", pos: true },
      { txt: "+41 $", pos: true },
      { txt: "-63 $", pos: false },
      { txt: "+276 $", pos: true },
      { txt: "+35 $", pos: true },
      { txt: "-19 $", pos: false },
      { txt: "+142 $", pos: true },
      { txt: "+74 $", pos: true },
      { txt: "-33 $", pos: false },
    ];
  
    return (
      <div
        aria-hidden
        className="
          fixed inset-0 z-0 pointer-events-none overflow-hidden fm-bg
        "
      >
        {/* --- ORBES (radiaux) --- */}
        <div className="fm-orb fm-orb--a" />
        <div className="fm-orb fm-orb--b" />
        <div className="fm-orb fm-orb--c" />
        <div className="fm-orb fm-orb--d" />
  
        {/* --- GRILLE marché (pan lent) --- */}
        <div className="fm-grid fm-grid--hero" />
  
        {/* --- Chandelles qui flottent --- */}
        {candles.map((x, i) => (
          <div
            key={x}
            className="fm-candle"
            style={{ left: `${x}%`, animationDelay: `${i * 0.8}s` }}
          >
            <span className="fm-candle-body" />
          </div>
        ))}
  
        {/* --- Badges de gains/pertes (scatter) --- */}
        <div className="fm-gains">
          {gains.map((g, i) => (
            <span key={i} className={`fm-gain ${g.pos ? "g" : "r"}`}>{g.txt}</span>
          ))}
        </div>
      </div>
    );
  }