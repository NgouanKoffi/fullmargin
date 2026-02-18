import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Settings2, Users, KeyRound, MessageSquareText } from "lucide-react";

export default function ServiceHome() {
  const { status, user } = useAuth();
  const isAgent = status === "authenticated" && (user?.roles ?? []).includes("agent");
  const isAdmin = status === "authenticated" && (user?.roles ?? []).includes("admin");

  useEffect(() => {
    // Optionnel: si on arrive depuis un deep-link qui a déjà ouvert la sidebar,
    // on pourrait placer ici une logique supplémentaire (analytics, etc.)
  }, []);

  const openSidebar = () => window.dispatchEvent(new CustomEvent("fm:open-service"));

  if (!isAgent && !isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Accès service</h1>
        <p className="text-skin-muted">Vous n’avez pas accès à cet espace.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-skin-border/20 bg-skin-surface">
          <Settings2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Service — Vue d’ensemble</h1>
          <p className="text-skin-muted">
            Accédez rapidement aux membres, aux permissions et aux messages liés à votre service.
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={openSidebar}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
          >
            <Settings2 className="w-4 h-4" />
            Ouvrir le panneau
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/service/membres"
          className="group rounded-2xl p-4 ring-1 ring-skin-border/20 bg-skin-surface hover:bg-skin-tile transition flex items-center gap-3"
        >
          <div className="shrink-0 w-10 h-10 rounded-xl ring-1 ring-skin-border/20 bg-skin-surface flex items-center justify-center group-hover:bg-white group-hover:text-[#7c3aed]">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium">Membres du service</div>
            <div className="text-sm text-skin-muted">Voir qui est affecté à votre service</div>
          </div>
        </Link>

        <Link
          to="/service/permissions"
          className="group rounded-2xl p-4 ring-1 ring-skin-border/20 bg-skin-surface hover:bg-skin-tile transition flex items-center gap-3"
        >
          <div className="shrink-0 w-10 h-10 rounded-xl ring-1 ring-skin-border/20 bg-skin-surface flex items-center justify-center group-hover:bg-white group-hover:text-[#7c3aed]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium">Permissions</div>
            <div className="text-sm text-skin-muted">Affectations & droits des utilisateurs</div>
          </div>
        </Link>

        <Link
          to="/service/messages"
          className="group rounded-2xl p-4 ring-1 ring-skin-border/20 bg-skin-surface hover:bg-skin-tile transition flex items-center gap-3"
        >
          <div className="shrink-0 w-10 h-10 rounded-xl ring-1 ring-skin-border/20 bg-skin-surface flex items-center justify-center group-hover:bg-white group-hover:text-[#7c3aed]">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <div className="font-medium">Messages</div>
            <div className="text-sm text-skin-muted">Communication liée au service</div>
          </div>
        </Link>
      </div>

      {/* Infos session */}
      <div className="rounded-2xl p-4 ring-1 ring-skin-border/20 bg-skin-surface">
        <div className="text-sm text-skin-muted mb-1">Contexte</div>
        <div className="text-sm">
          Rôles: <code className="px-1 rounded bg-skin-tile">{(user?.roles ?? []).join(", ")}</code>
        </div>
      </div>
    </div>
  );
}
