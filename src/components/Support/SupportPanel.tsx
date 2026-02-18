// src/components/Support/SupportPanel.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Close } from "../Header/icons";
import { FaWhatsapp } from "react-icons/fa";

/* ===================== WhatsApp ===================== */
const WHATSAPP_NUMBER_E164 = "33652395381"; // +33 6 52 39 53 81 (sans espaces)
const WHATSAPP_PREFILL = "Bonjour, j’ai besoin d’aide sur FullMargin.";

function buildWhatsAppUrl() {
  const text = encodeURIComponent(WHATSAPP_PREFILL);
  return `https://wa.me/${WHATSAPP_NUMBER_E164}?text=${text}`;
}

/* ===================== Small icons ===================== */
const IconHome = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    aria-hidden="true"
  >
    <path
      d="M3 10.5L12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5v-9Z"
      strokeWidth="1.6"
    />
    <path d="M9 22v-7h6v7" strokeWidth="1.6" />
  </svg>
);

const IconLock = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    aria-hidden="true"
  >
    <rect x="3.5" y="11" width="17" height="10" rx="2" strokeWidth="1.6" />
    <path d="M7.5 11V8a4.5 4.5 0 0 1 9 0v3" strokeWidth="1.6" />
    <circle cx="12" cy="16" r="1.3" strokeWidth="1.6" />
  </svg>
);

const tileLight =
  "bg-[rgb(var(--tile))] hover:bg-[rgb(var(--tile-strong))] text-gray-810";
const tileDark = "dark:bg-white/10 dark:hover:bg-white/15 dark:text-white";

type Tab = "home" | "chat";

export default function SupportPanel({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("home");
  const navigate = useNavigate();

  if (!open) return null;

  const goToFaq = () => {
    navigate("/faq");
    onClose();
  };

  const openWhatsApp = () => {
    const url = buildWhatsAppUrl();
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <aside
      className={`
        fixed z-[71]
        inset-0
        min-[810px]:inset-auto min-[810px]:bottom-4 min-[810px]:right-4
        min-[810px]:w-[420px] min-[810px]:h-[min(80vh,720px)] min-[810px]:rounded-2xl
        shadow-2xl ring-1 ring-skin-border/20 overflow-hidden
        bg-skin-surface
      `}
      role="dialog"
      aria-label="Assistance FullMargin"
    >
      {/* Header */}
      <div className="relative h-16 bg-gradient-to-br from-skin-primary to-skin-accent">
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <div className="text-white">
            <div className="text-[15px] font-semibold leading-5">
              Support FullMargin
            </div>
            <div className="text-xs/5 opacity-80">
              Comment pouvons-nous vous aider ?
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-full
                     bg-white/20 hover:bg-white/30 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          style={{ right: "max(8px, env(safe-area-inset-right, 0px))" }}
        >
          <Close className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex h-[calc(100dvh-64px)] min-[810px]:h-[calc(min(80vh,720px)-64px)] flex-col">
        {tab === "home" && (
          <div className="flex-1 overflow-y-auto p-3 space-y-3 no-scrollbar">
            <div
              className={`rounded-2xl px-3 py-3 ring-1 ring-skin-border/15 ${tileLight} ${tileDark}`}
            >
              <div className="text-[15px] font-semibold text-skin-base">
                Bonjour 👋
              </div>
              <div className="text-sm opacity-80 text-skin-base">
                Retrouvez l’aide et la documentation de FullMargin.
              </div>
            </div>

            {/* bouton pour aller écrire au support (ouvre l’onglet chat) */}
            <button
              onClick={() => setTab("chat")}
              className={`w-full rounded-2xl px-4 py-3 text-left ${tileLight} ${tileDark}`}
            >
              Envoyer un message
              <div className="text-xs opacity-70">
                Contactez-nous directement
              </div>
            </button>

            {/* ✅ WhatsApp (dans le popup) */}
            <button
              onClick={openWhatsApp}
              className={`w-full rounded-2xl px-4 py-3 text-left ring-1 ring-skin-border/15 ${tileLight} ${tileDark}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-[#25D366] text-white">
                    <FaWhatsapp className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-skin-base">
                      WhatsApp
                    </div>
                    <div className="text-xs opacity-70 text-skin-base">
                      Réponse rapide (ouvrir la discussion)
                    </div>
                  </div>
                </div>

                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 opacity-70"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="m9 6 6 6-6 6"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>

            {/* bloc FAQ avec redirection react-router */}
            <div className="rounded-2xl px-4 py-4 ring-1 ring-skin-border/15 bg-white/70 dark:bg-white/5">
              <div className="text-sm font-semibold text-skin-base mb-1">
                Questions fréquentes
              </div>
              <p className="text-xs text-skin-base/70 mb-3">
                Pour consulter toutes les réponses et tutos, ouvrez la page FAQ.
              </p>
              <button
                onClick={goToFaq}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-skin-primary text-white text-xs font-medium"
              >
                Aller à la FAQ
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="m9 6 6 6-6 6"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            {/* mail direct */}
            <a
              href="mailto:support@fullmargin.net"
              className="mt-1 inline-flex items-center justify-center w-full rounded-full bg-gradient-to-r from-fm-primary to-fm-primary2 text-white px-5 py-2 text-sm font-medium"
            >
              Écrire à support@fullmargin.net
            </a>
          </div>
        )}

        {tab === "chat" && (
          <div className="flex-1 flex items-center justify-center p-6">
            <div
              className={`w-full rounded-2xl px-6 py-8 text-center ring-1 ring-skin-border/15 ${tileLight} ${tileDark}`}
            >
              <div className="flex items-center justify-center">
                <IconLock className="w-10 h-10 opacity-90" />
              </div>
              <div className="mt-3 text-base font-semibold text-skin-base">
                Service momentanément indisponible
              </div>
              <div className="text-sm opacity-75 mt-1 text-skin-base">
                Le canal de discussion n’est pas encore ouvert. Vous pouvez nous
                contacter via :
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <a
                  href="mailto:support@fullmargin.net"
                  className="inline-flex items-center justify-center rounded-full px-4 py-2 bg-skin-primary text-white text-sm"
                >
                  support@fullmargin.net
                </a>

                <button
                  onClick={openWhatsApp}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2
                             bg-[#25D366] hover:bg-[#1EBE5D] text-white text-sm"
                >
                  <FaWhatsapp className="w-5 h-5" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Menu du bas : il ne reste QUE Accueil */}
        <nav className="border-t border-skin-border/15 px-2 py-2 grid grid-cols-1 text-xs">
          <button
            onClick={() => setTab("home")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2
              ${
                tab === "home"
                  ? "text-skin-primary bg-white/60 dark:bg-white/10"
                  : "text-skin-base/70 hover:bg-white/50 dark:hover:bg-white/5"
              }`}
          >
            <IconHome />
            <span>Accueil</span>
          </button>
        </nav>
      </div>
    </aside>
  );
}
