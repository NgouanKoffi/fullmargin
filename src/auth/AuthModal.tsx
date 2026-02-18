// C:\Users\ADMIN\Desktop\fullmargin-site\src\auth\AuthModal.tsx
import { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { useAuth } from "./AuthContext";
import FeatureList from "./ui/FeatureList";
import GoogleButton from "./ui/GoogleButton";
import ResetPasswordFlowModal from "./ui/modals/ResetPassword/ResetPasswordModal";
import { notifySuccess } from "../components/Notification";
import SignInForm from "./ui/forms/SignInForm";
import SignUpForm from "./ui/forms/SignUpForm";

type Tab = "signin" | "signup";

// Helper sûr pour manipuler le overflow du body (évite les any et les unused-expressions)
function setBodyOverflow(value: "" | "hidden") {
  if (typeof document === "undefined") return;
  const body = document.body as HTMLBodyElement | null;
  if (body && body.style) {
    body.style.overflow = value;
  }
}

export default function AuthModal() {
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("signup");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // 🧩 garde-fou: capture le ref présent dans l'URL quand le modal s'ouvre
  const captureReferralFromUrl = () => {
    const sp = new URLSearchParams(window.location.search);
    const ref = (sp.get("ref") || "").trim().toUpperCase();
    if (ref) localStorage.setItem("fm:referral", ref);
  };

  // 🔕 helper: ne pas ouvrir si on vient de se déconnecter (TTL actif)
  const suppressed = () => {
    const until = Number(
      sessionStorage.getItem("fm:suppress-auth-modal-until") || 0
    );
    return !!until && Date.now() < until;
  };

  // Évènements ouverture/fermeture du modal
  useEffect(() => {
    const onOpen = (e: Event) => {
      // ⛔️ ignore l'ouverture pendant le TTL de suppression (logout récent)
      if (suppressed()) return;

      const detail = (e as CustomEvent).detail as { mode?: Tab } | undefined;
      if (detail?.mode === "signin" || detail?.mode === "signup")
        setTab(detail.mode);
      setOpen(true);
      captureReferralFromUrl(); // ⬅️ mémorise le ref si présent
      document.documentElement.setAttribute("data-hide-support", "true");
      setBodyOverflow("hidden");
    };

    const onClose = () => {
      setOpen(false);
      document.documentElement.removeAttribute("data-hide-support");
      setBodyOverflow("");
    };

    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") onClose();
    };

    window.addEventListener("fm:open-account", onOpen as EventListener);
    window.addEventListener("fm:close-account", onClose as EventListener);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("fm:open-account", onOpen as EventListener);
      window.removeEventListener("fm:close-account", onClose as EventListener);
      window.removeEventListener("keydown", onEsc);
      document.documentElement.removeAttribute("data-hide-support");
      setBodyOverflow("");
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      <div
        className="absolute inset-0 backdrop-blur-[14px]"
        onClick={() =>
          window.dispatchEvent(new CustomEvent("fm:close-account"))
        }
      />
      <div className="absolute inset-0 grid grid-rows-[auto,1fr]">
        <div className="px-3 sm:px-5 py-3 flex items-center gap-2">
          <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface/70 backdrop-blur-md p-1">
            <button
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                tab === "signin"
                  ? "bg-fm-primary text-white"
                  : "bg-transparent hover:bg-skin-tile text-skin-base"
              }`}
              onClick={() => setTab("signin")}
            >
              Se connecter
            </button>
            <button
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                tab === "signup"
                  ? "bg-fm-primary text-white"
                  : "bg-transparent hover:bg-skin-tile text-skin-base"
              }`}
              onClick={() => setTab("signup")}
            >
              Créer un compte
            </button>
          </div>

          <button
            aria-label="Fermer"
            className="ml-auto inline-flex items-center justify-center rounded-full p-2 ring-1 ring-skin-border/20 bg-skin-surface/70 backdrop-blur-md hover:bg-skin-tile"
            onClick={() =>
              window.dispatchEvent(new CustomEvent("fm:close-account"))
            }
          >
            <IoMdClose className="w-5 h-5" />
          </button>
        </div>

        <section className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8 w-full h-full overflow-auto no-scrollbar overscroll-contain">
          <div className="w-full rounded-3xl ring-1 ring-skin-border/20 shadow-2xl supports-[backdrop-filter]:bg-skin-surface/65 bg-skin-surface/90 backdrop-blur-xl grid md:grid-cols-2">
            <FeatureList className="hidden md:block" />
            <div className="p-6 lg:p-10 md:border-l border-skin-border/15">
              <div className="relative">
                {/* ⬇️ Utilise le helper du contexte qui propage ?ref=... */}
                <GoogleButton onClick={signInWithGoogle} />
              </div>

              <div className="h-5" />

              {tab === "signin" ? (
                <SignInForm
                  loading={loading}
                  onSubmit={async (email, password) => {
                    setLoading(true);
                    const ok = await signIn(email, password);
                    if (ok) {
                      window.dispatchEvent(new CustomEvent("fm:close-account"));
                    }
                    setLoading(false);
                  }}
                  onSwitchToSignUp={() => setTab("signup")}
                  onForgotPassword={() => setForgotOpen(true)}
                />
              ) : (
                <SignUpForm
                  loading={loading}
                  onSubmit={async (fullName, email, password) => {
                    setLoading(true);
                    const ok = await signUp(fullName, email, password); // le ref est ajouté dans AuthContext
                    if (ok) {
                      notifySuccess(
                        "Vérifie ta boîte mail",
                        "Nous t’avons envoyé un code."
                      );
                      // ❌ ne ferme pas ici : le modal 2FA doit s'afficher
                      // window.dispatchEvent(new CustomEvent("fm:close-account"));
                    }

                    setLoading(false);
                  }}
                  onSwitchToSignIn={() => setTab("signin")}
                />
              )}
            </div>
          </div>
        </section>
      </div>

      <ResetPasswordFlowModal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
      />
    </div>
  );
}
