// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Footer.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Facebook, Instagram, Youtube } from "lucide-react";
import Lottie from "lottie-react";
import trophyAnim from "@assets/lottiefile/Trophy.json";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";

export default function Footer() {
  const year = new Date().getFullYear();
  const navigate = useNavigate();

  const [redirectingFM, setRedirectingFM] = useState(false);

  // 🔁 Même logique que goToFM() dans AccountList
  async function handleFullMetrixClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (redirectingFM) return;

    const session = loadSession?.();
    const token = session?.token;

    // pas connecté → page tarifs
    if (!token) {
      navigate("/tarifs");
      return;
    }

    setRedirectingFM(true);
    try {
      // 1) Vérifier l'accès FM Metrix
      const accessResp = await fetch(`${API_BASE}/payments/fm-metrix/access`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const accessData = await accessResp.json().catch(() => null);

      const isOk = accessResp.ok && accessData?.ok;
      const allowed = Boolean(accessData?.allowed);

      if (!isOk || !allowed) {
        setRedirectingFM(false);
        navigate("/tarifs");
        return;
      }

      // 2) Récupérer l'URL SSO
      const ssoResp = await fetch(`${API_BASE}/auth/sso/fullmetrix?mode=json`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const ssoData = await ssoResp.json().catch(() => null);

      if (ssoResp.ok && ssoData?.ok && ssoData.redirectUrl) {
        // redirection externe
        window.location.href = ssoData.redirectUrl;
        return;
      }

      // fallback → tarifs
      setRedirectingFM(false);
      navigate("/tarifs");
    } catch {
      setRedirectingFM(false);
      navigate("/tarifs");
    }
  }

  return (
    <footer className="w-full relative isolate bg-skin-bg text-skin-base overflow-hidden [contain:layout_paint_style] border-t border-skin-border/20">
      {/* décor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(1100px 700px at 12% 0%, rgba(149,100,255,.22), transparent 55%), radial-gradient(900px 600px at 92% 12%, rgba(134,56,255,.14), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[.06] mix-blend-overlay"
          style={{
            backgroundImage:
              "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22 viewBox=%220 0 40 40%22><path d=%22M0 39.5h40M39.5 0v40%22 stroke=%22%23fff%22 stroke-opacity=%220.6%22 stroke-width=%220.5%22/></svg>')",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* alignement principal */}
      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        {/* haut du footer */}
        <div className="py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-[.6fr_1fr] gap-8 items-center">
          {/* Lottie */}
          <div className="flex items-center justify-center">
            <div className="relative">
              <div
                className="absolute inset-0 blur-3xl opacity-30 -z-10"
                style={{
                  background:
                    "radial-gradient(120px 120px at 50% 50%, rgba(149,100,255,.6), transparent 60%)",
                }}
              />
              <Lottie
                animationData={trophyAnim}
                loop
                className="w-40 h-40 sm:w-48 sm:h-48 lg:w-56 lg:h-56 select-none pointer-events-none"
              />
            </div>
          </div>

          {/* texte + socials */}
          <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface/40 backdrop-blur-sm p-8 shadow-dropdown">
            <h3 className="text-2xl font-extrabold text-skin-base">FullMargin</h3>
            <p className="mt-2 text-base text-skin-muted max-w-md">
              La plateforme pour les traders, créateurs et communautés. Unifiez
              vos outils, boostez vos performances et connectez-vous autrement.
            </p>

            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <a
                href="https://www.instagram.com/fullmargin_ltd?igsh=OG1idGRrZGhxYzkz"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-xl ring-1 ring-skin-border/30 bg-skin-surface px-3.5 py-3 text-base font-semibold text-skin-base hover:bg-skin-border/20 transition-colors"
              >
                <Instagram className="w-5 h-5 opacity-85 group-hover:opacity-100" />
                <span className="hidden sm:inline">Instagram</span>
              </a>
              <a
                href="https://youtube.com/@fullmargin-net?si=YE6SOmH9zawJpehD"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-xl ring-1 ring-skin-border/30 bg-skin-surface px-3.5 py-3 text-base font-semibold text-skin-base hover:bg-skin-border/20 transition-colors"
              >
                <Youtube className="w-5 h-5 opacity-85 group-hover:opacity-100" />
                <span className="hidden sm:inline">YouTube</span>
              </a>
              <a
                href="https://www.facebook.com/share/178mjdQowx/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-xl ring-1 ring-skin-border/30 bg-skin-surface px-3.5 py-3 text-base font-semibold text-skin-base hover:bg-skin-border/20 transition-colors"
              >
                <Facebook className="w-5 h-5 opacity-85 group-hover:opacity-100" />
                <span className="hidden sm:inline">Facebook</span>
              </a>
            </div>
          </div>
        </div>

        {/* liens 4 colonnes / 2 lignes */}
        <div className="pb-10 lg:pb-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2 text-base text-skin-muted">
            {/* Full Metrix avec même logique d'accès que dans AccountList */}
            <button
              type="button"
              onClick={handleFullMetrixClick}
              disabled={redirectingFM}
              className="block text-left hover:text-skin-base disabled:opacity-60"
            >
              {redirectingFM ? "Connexion à Full Metrix…" : "Full Metrix"}
            </button>

            <Link to="/marketplace?cat=all" className="block hover:text-skin-base">
              Marketplace
            </Link>
          </div>

          <div className="space-y-2 text-base text-skin-muted">
            <Link to="/communaute" className="block hover:text-skin-base">
              Communauté
            </Link>
            <Link to="/a-propos" className="block hover:text-skin-base">
              À propos
            </Link>
          </div>
          <div className="space-y-2 text-base text-skin-muted">
            <Link to="/conditions" className="block hover:text-skin-base">
              Conditions d’utilisation
            </Link>
            <Link to="/charte-vendeur" className="block hover:text-skin-base">
              Charte vendeur
            </Link>
          </div>

          {/* ordre selon ton image : 1 = FM Metrix, puis Politique de remboursement */}
          <div className="space-y-2 text-base text-skin-muted">
            <Link to="/remboursement" className="block hover:text-skin-base">
              Politique de remboursement
            </Link>
            <Link to="/cgv" className="block hover:text-skin-base">
              CGV Marketplace
            </Link>
          </div>
        </div>

        {/* bas */}
        <div className="py-7 border-t border-skin-border/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-base text-skin-muted">
            © {year}{" "}
            <span className="font-semibold text-skin-base">FullMargin</span>. Tous
            droits réservés.
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-skin-muted">
            <Link to="/mentions-legales" className="hover:text-skin-base">
              Mentions légales
            </Link>
            <span className="opacity-40">•</span>
            <Link to="/confidentialite" className="hover:text-skin-base">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>

      <div className="h-px -mb-px" aria-hidden="true" />
    </footer>
  );
}
