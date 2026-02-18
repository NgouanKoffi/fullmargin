import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { KeyRound, Save, Settings2 } from "lucide-react";

export default function ServicePermissions() {
  const { status, user } = useAuth();
  const isAgent =
    status === "authenticated" && (user?.roles ?? []).includes("agent");
  const isAdmin =
    status === "authenticated" && (user?.roles ?? []).includes("admin");

  const [userId, setUserId] = useState("");
  const [serviceIdsCsv, setServiceIdsCsv] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const openSidebar = () =>
    window.dispatchEvent(new CustomEvent("fm:open-service"));

  const canEdit = isAdmin || isAgent; // si tu veux restreindre, change ici

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!canEdit) return;
    try {
      setSaving(true);
      // ⚠️ À brancher sur ton endpoint d’assignation côté agent si/Quand dispo.
      // Pour le moment on simule.
      await new Promise((r) => setTimeout(r, 600));
      setMsg("Affectations mises à jour (simulation).");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
          ? err
          : "Échec de la mise à jour";
      setMsg(message);
    } finally {
      setSaving(false);
    }
  }

  if (!isAgent && !isAdmin) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Permissions du service</h1>
        <p className="text-skin-muted">Accès refusé.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-skin-border/20 bg-skin-surface">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Permissions du service</h1>
          <p className="text-skin-muted">
            Affectez des utilisateurs à votre service.
          </p>
        </div>
        <div className="ml-auto">
          <button
            onClick={openSidebar}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
          >
            <Settings2 className="w-4 h-4" />
            Panneau
          </button>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl p-4 ring-1 ring-skin-border/20 bg-skin-surface space-y-4"
      >
        <div>
          <label className="text-sm font-medium">ID utilisateur</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-skin-border/30 bg-transparent px-3 py-2"
            placeholder="6580f2... (ObjectId)"
            disabled={!canEdit}
          />
        </div>
        <div>
          <label className="text-sm font-medium">
            Services (IDs séparés par des virgules)
          </label>
          <input
            value={serviceIdsCsv}
            onChange={(e) => setServiceIdsCsv(e.target.value)}
            className="mt-1 w-full rounded-xl border border-skin-border/30 bg-transparent px-3 py-2"
            placeholder="64ff..., 64aa..., 64bb..."
            disabled={!canEdit}
          />
          <p className="text-xs text-skin-muted mt-1">
            La liste remplace les affectations existantes de l’utilisateur.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canEdit || saving}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-4 py-2",
              canEdit
                ? "bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
                : "bg-skin-tile text-skin-muted cursor-not-allowed",
            ].join(" ")}
          >
            <Save className="w-4 h-4" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          {msg && <span className="text-sm text-skin-muted">{msg}</span>}
        </div>
      </form>

      <div className="rounded-2xl p-4 ring-1 ring-skin-border/20 bg-skin-surface">
        <div className="text-sm text-skin-muted">
          Astuce : le panneau Service (à droite) permet un accès rapide aux
          sections importantes.
        </div>
      </div>
    </div>
  );
}
