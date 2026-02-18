// src/pages/NotFoundPage.tsx
import Lottie from "lottie-react";
import emptyAnim from "../assets/lottiefile/error.json";
import { Link } from "react-router-dom";
import { ArrowLeft, LifeBuoy } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-[#0f1115] transition-colors px-4 pb-10">
      <div
        className="
          w-full max-w-6xl
          grid grid-cols-1 lg:grid-cols-2
          items-center gap-10 lg:gap-16
        "
      >
        {/* Visuel */}
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <Lottie animationData={emptyAnim} loop aria-label="Illustration 404" />
          </div>
        </div>

        {/* Texte amélioré */}
        <section
          className="
            flex flex-col justify-center
            text-center lg:text-left
          "
          aria-labelledby="nf-title"
        >
          {/* Eyebrow / Badge */}
          <div className="inline-flex items-center justify-center lg:justify-start gap-2 self-center lg:self-auto mb-3">
            <span
              className="
                rounded-full border border-gray-200 dark:border-white/10
                px-3 py-1 text-xs font-medium
                text-gray-600 dark:text-gray-300
                bg-gray-50 dark:bg-white/5
              "
            >
              Erreur 404
            </span>
          </div>

          {/* Titre */}
          <h1
            id="nf-title"
            className="
              text-3xl md:text-5xl font-extrabold tracking-tight
              text-gray-900 dark:text-white
              [text-wrap:balance]
            "
          >
            Page introuvable
          </h1>

          {/* Sous-texte */}
          <p
            className="
              mt-3 text-base md:text-lg leading-relaxed
              text-gray-600 dark:text-gray-400
              max-w-xl self-center lg:self-auto
            "
          >
            La page que vous cherchez n’existe pas, a été renommée ou déplacée.
            Vérifiez l’URL ou revenez à l’accueil.
          </p>

          {/* Actions */}
          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Link
              to="/"
              className="
                inline-flex items-center justify-center gap-2
                px-6 py-3 rounded-full font-semibold
                text-white bg-gray-900 hover:bg-black
                dark:bg-gray-700 dark:hover:bg-gray-600
                transition-colors shadow
              "
            >
              <ArrowLeft className="w-5 h-5" />
              Retour à l’accueil
            </Link>

            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("fm:open-support"))}
              className="
                inline-flex items-center justify-center gap-2
                px-6 py-3 rounded-full font-semibold
                text-gray-800 dark:text-gray-200
                border border-gray-200/70 dark:border-white/10
                bg-transparent hover:bg-gray-50 dark:hover:bg-white/5
                transition-colors
              "
            >
              <LifeBuoy className="w-5 h-5" />
              Contacter le support
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}