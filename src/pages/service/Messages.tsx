import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { MessageSquareText, Send, Settings2 } from "lucide-react";

export default function ServiceMessages() {
  const { status, user } = useAuth();
  const isAgent = status === "authenticated" && (user?.roles ?? []).includes("agent");
  const isAdmin = status === "authenticated" && (user?.roles ?? []).includes("admin");

  const [text, setText] = useState("");

  const openSidebar = () => window.dispatchEvent(new CustomEvent("fm:open-service"));

  if (!isAgent && !isAdmin) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Messages du service</h1>
        <p className="text-skin-muted">Accès refusé.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-start gap-3">
        <div className="inline-flex items-center justify-center rounded-xl p-2 ring-1 ring-skin-border/20 bg-skin-surface">
          <MessageSquareText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Messages du service</h1>
          <p className="text-skin-muted">Espace d’échanges interne au service.</p>
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

      {/* Zone "conversation" — placeholder */}
      <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface p-4 h-[420px] flex flex-col">
        <div className="text-sm text-skin-muted">
          Aucun message pour le moment. (Espace à brancher sur ta messagerie/threads de service.)
        </div>

        <div className="mt-auto pt-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrire un message…"
            className="flex-1 rounded-xl border border-skin-border/30 bg-transparent px-3 py-2"
          />
          <button
            onClick={() => setText("")}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
          >
            <Send className="w-4 h-4" />
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
