import { useAuth } from "../../auth/AuthContext";
import { Users, Plus, Settings2 } from "lucide-react";

export default function ServiceMembers() {
  const { status, user } = useAuth();
  const isAgent = status === "authenticated" && (user?.roles ?? []).includes("agent");
  const isAdmin = status === "authenticated" && (user?.roles ?? []).includes("admin");

  const openSidebar = () => window.dispatchEvent(new CustomEvent("fm:open-service"));

  if (!isAgent && !isAdmin) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Membres du service</h1>
        <p className="text-skin-muted">Accès refusé.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-skin-border/20 bg-skin-surface">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Membres du service</h1>
          <p className="text-skin-muted">
            Visualisez la liste des membres rattachés à votre service.
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={openSidebar}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
          >
            <Settings2 className="w-4 h-4" />
            Panneau
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 ring-1 ring-skin-border/20 bg-skin-surface hover:bg-skin-tile"
            onClick={() => {
              // Placeholder action (à brancher sur ton flux d’ajout)
              window.dispatchEvent(new CustomEvent("fm:open-service"));
            }}
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Table placeholder */}
      <div className="rounded-2xl ring-1 ring-skin-border/20 overflow-hidden">
        <div className="grid grid-cols-12 bg-skin-tile text-sm font-medium">
          <div className="col-span-5 py-3 px-4">Membre</div>
          <div className="col-span-5 py-3 px-4">Services</div>
          <div className="col-span-2 py-3 px-4">Depuis</div>
        </div>
        <div className="divide-y divide-skin-border/10">
          <div className="grid grid-cols-12 py-3 px-4 text-sm text-skin-muted">
            <div className="col-span-12">Aucune donnée pour le moment.</div>
          </div>
        </div>
      </div>

      <p className="text-sm text-skin-muted">
        Astuce : utilisez le **panneau Service** pour filtrer/afficher un service en particulier.
      </p>
    </div>
  );
}
