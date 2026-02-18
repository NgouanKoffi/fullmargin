import { ArrowRight } from "lucide-react";

// ✅ Images
import BottomBg from "../../../assets/fmmetrix/Fond de bas de page.webp";
import RobotCutout from "../../../assets/fmmetrix/Fullmetrix bas de page sans fond.webp";

type Props = {
  goToFM: () => void;
  isLoading: boolean;
};

export default function FmMetrixFooter({ goToFM, isLoading }: Props) {
  return (
    <footer className="w-full bg-white dark:bg-black">
      {/* ✅ Bandeau violet (arrondi en haut) */}
      <section className="mx-auto max-w-[1600px] px-4 md:px-6 pt-10 md:pt-14">
        <div className="relative overflow-visible">
          {/* ✅ Le bloc fond (clippé) */}
          <div className="relative overflow-hidden rounded-t-[46px] bg-black">
            {/* Fond */}
            <img
              src={BottomBg}
              alt=""
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* léger voile pour lisibilité */}
            <div className="absolute inset-0 bg-black/10 dark:bg-black/20" />

            {/* ✅ Contenu : on laisse de la marge en haut pour le robot */}
            <div className="relative grid items-end gap-8 px-6 pt-16 pb-10 md:px-10 md:pt-20 md:pb-12 lg:grid-cols-[520px_1fr]">
              {/* Colonne robot : on garde vide ici pour garder la grille propre */}
              <div className="hidden lg:block" />

              {/* Texte + bouton (droite) */}
              <div className="text-center lg:text-right">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
                  <span className="text-violet-400">FULL METRIX,</span> votre
                  espace
                  <br className="hidden md:block" />
                  professionnel alimenté par l’IA pour passer
                  <br className="hidden md:block" />
                  au niveau supérieur.
                </h2>

                <button
                  type="button"
                  onClick={goToFM}
                  disabled={isLoading}
                  className="
                    mt-8 inline-flex items-center justify-center gap-2
                    rounded-full px-10 py-3.5
                    font-semibold text-white
                    bg-violet-600 hover:bg-violet-500 active:scale-[0.98]
                    shadow-[0_18px_60px_rgba(123,97,255,0.35)]
                    transition disabled:opacity-70 disabled:cursor-wait
                  "
                >
                  {isLoading ? "Connexion…" : "Accédez à Full metrix"}
                  {!isLoading ? (
                    <ArrowRight className="h-5 w-5" />
                  ) : (
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ✅ Robot qui dépasse (par-dessus le bloc violet) */}
          <div className="pointer-events-none absolute left-6 md:left-10 lg:left-12 -top-10 md:-top-14 lg:-top-16">
            <img
              src={RobotCutout}
              alt="Full Metrix"
              draggable={false}
              className="
                w-[220px] sm:w-[260px] md:w-[320px] lg:w-[380px]
                select-none
                drop-shadow-[0_26px_90px_rgba(123,97,255,0.45)]
              "
            />
          </div>
        </div>
      </section>

      {/* ✅ Barre noire du bas (SANS Canva) */}
      <div className="mt-0 bg-black">
        <div className="mx-auto max-w-[1600px] px-4 md:px-6 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-white/85">
              <a href="/conditions" className="hover:text-white transition">
                Conditions et assistance
              </a>
              <a
                href="/politique-de-confidentialite"
                className="hover:text-white transition"
              >
                Politique de confidentialité
              </a>
            </div>

            {/* ✅ rien à droite (on laisse vide ou tu peux mettre copyright plus tard) */}
            <div className="hidden sm:block" />
          </div>
        </div>
      </div>
    </footer>
  );
}
