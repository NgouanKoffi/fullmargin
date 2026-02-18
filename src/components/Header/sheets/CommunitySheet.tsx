import { useAuth } from "../../../auth/AuthContext";
import { Users } from "lucide-react";
import BaseSheet from "./BaseSheet";

/** Ouvre l’auth en mémorisant une destination (intention) */
function openAuthWithFrom(to?: string, mode: "signin" | "signup" = "signin") {
  try {
    const href =
      (to && to.trim()) ||
      window.location.pathname + window.location.search + window.location.hash;
    localStorage.setItem("fm:oauth:from", href);
    localStorage.setItem("fm:oauth:open", "account");
  } catch {
    // ignore
  }
  window.dispatchEvent(
    new CustomEvent("fm:open-account", { detail: { mode } })
  );
}

export default function CommunitySheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { status } = useAuth();
  const isGuest = status !== "authenticated";
  const labelledById = "community-sheet-title";

  if (isGuest) {
    return (
      <BaseSheet
        open={open}
        onClose={onClose}
        labelledById={labelledById}
        title="Communauté"
      >
        <p className="mt-2 text-sm text-skin-muted">
          Connectez-vous pour accéder à vos communautés, invitations et
          paramètres.
        </p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => {
              // intention: accéder au dashboard communauté
              openAuthWithFrom("/communautes/dashboard?tab=feed", "signin");
              onClose();
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 font-medium text-white shadow
                       hover:bg-violet-500 active:scale-[.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            Se connecter
          </button>
        </div>
      </BaseSheet>
    );
  }

  const items = [
    {
      label: "Communautés (public)",
      href: "/communautes",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Mon espace communauté",
      href: "/communautes/dashboard",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Invitations",
      href: "/communautes/invitations",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Paramètres",
      href: "/communautes/settings",
      icon: <Users className="w-5 h-5" />,
    },
  ];

  return (
    <BaseSheet
      open={open}
      onClose={onClose}
      labelledById={labelledById}
      title="Communauté"
    >
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2">
        {items.map((i) => (
          <button
            key={i.href}
            type="button"
            onClick={() => {
              window.location.href = i.href;
              onClose(); // Fermeture après action
            }}
            className="rounded-2xl px-4 py-3 text-sm bg-gray-200 hover:bg-gray-300"
          >
            <div className="flex items-center gap-2">
              {i.icon}
              <span>{i.label}</span>
            </div>
          </button>
        ))}
      </div>
    </BaseSheet>
  );
}
