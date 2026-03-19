// src/pages/admin/Messages/DiffusionTab.tsx
import { useEffect, useMemo, useState } from "react";
import type { DiffusionGroup } from "./DiffusionTab/types";
import { notifySuccess, notifyError } from "@shared/components/Notification";
import DiffusionEditor from "./DiffusionTab/DiffusionEditor";
import DiffusionList from "./DiffusionTab/DiffusionList";
import { api, ApiError } from "@core/api/client";

/* ------------------------------------------------------------------ */
/* Types runtime-sûrs (réponses API)                                  */
/* ------------------------------------------------------------------ */
type RawSegments = {
  everyone?: unknown;
  agents?: unknown;
  communityOwners?: unknown;
  shopOwners?: unknown;
  custom?: unknown;
  customEmails?: unknown;
};

type RawGroup = {
  id?: unknown;
  _id?: unknown;
  name?: unknown;
  description?: unknown;
  segments?: RawSegments;
  updatedAt?: unknown;
  createdAt?: unknown;
};

type ListRes = {
  items: RawGroup[];
  total: number;
  offset: number;
  limit: number;
};
type OneRes = { ok: boolean; group: RawGroup };

/* ------------------------------------------------------------------ */
/* Parse helpers                                                       */
/* ------------------------------------------------------------------ */
function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function asBool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}
function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === "string" ? x : ""))
    .filter((x): x is string => x.length > 0);
}

function toSegments(raw?: RawSegments): DiffusionGroup["segments"] {
  const r = raw ?? {};
  return {
    everyone: asBool(r.everyone, false),
    agents: asBool(r.agents, false),
    communityOwners: asBool(r.communityOwners, false),
    shopOwners: asBool(r.shopOwners, false),
    custom: asBool(r.custom, false),
    customEmails: asStringArray(r.customEmails),
  };
}

function toGroup(g: RawGroup): DiffusionGroup {
  const rawId = g.id ?? g._id;
  const id = asString(rawId);
  return {
    id,
    name: asString(g.name, "Sans nom"),
    description: asString(g.description, ""),
    segments: toSegments(g.segments),
    updatedAt: asString(g.updatedAt, ""),
    createdAt: asString(g.createdAt, ""),
  };
}

function errMsg(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    if (e.status === 401) return "Accès refusé (401). Vérifie ta session.";
    if (e.status === 403) return "Accès refusé (403). Rôle admin requis.";
    return e.message || fallback;
  }
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
export default function DiffusionTab() {
  const [groups, setGroups] = useState<DiffusionGroup[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load(offset = 0, limit = 50, q = ""): Promise<void> {
    const data = await api.get<ListRes>("/admin/diffusions", {
      query: {
        limit,
        ...(offset ? { offset } : {}),
        ...(q ? { q } : {}),
      },
    });
    const items = Array.isArray(data.items) ? data.items.map(toGroup) : [];
    setGroups(items);
  }

  useEffect(() => {
    load().catch((e) => notifyError(errMsg(e, "Chargement impossible")));
  }, []);

  const editing = useMemo(
    () => groups.find((g) => g.id === editingId) || null,
    [groups, editingId]
  );

  /* ---------------------------- Actions ---------------------------- */

  // Crée immédiatement sur le serveur puis ouvre l’éditeur
  async function createGroup() {
    try {
      const payload: Omit<DiffusionGroup, "id" | "updatedAt" | "createdAt"> & {
        snapshot: boolean;
      } = {
        name: "Nouveau groupe",
        description: "",
        segments: {
          everyone: false,
          agents: false,
          communityOwners: false,
          shopOwners: false,
          custom: false,
          customEmails: [],
        },
        snapshot: false, // snapshot calculé à la sauvegarde
      };

      const data = await api.post<OneRes>("/admin/diffusions", payload);
      const created = toGroup(data.group);
      await load();
      setEditingId(created.id || null);
      notifySuccess("Groupe créé.");
    } catch (e: unknown) {
      notifyError(errMsg(e, "Création impossible"));
    }
  }

  // MàJ locale (pendant édition)
  function updateEditing(next: DiffusionGroup) {
    setGroups((arr) => arr.map((g) => (g.id === next.id ? next : g)));
  }

  // Sauvegarde serveur (PATCH + snapshot=true)
  async function saveEditing(next: DiffusionGroup) {
    try {
      const id = next.id;
      const payload = {
        name: next.name?.trim() || "Sans nom",
        description: next.description || "",
        segments: next.segments,
        snapshot: true, // recalcul snapshot côté serveur
      };
      const data = await api.patch<OneRes>(`/admin/diffusions/${id}`, payload);
      const saved = toGroup(data.group);
      setGroups((arr) => arr.map((g) => (g.id === id ? saved : g)));
      setEditingId(null);
      notifySuccess("Groupe enregistré.");
    } catch (e: unknown) {
      notifyError(errMsg(e, "Enregistrement impossible"));
    }
  }

  async function deleteGroup(id: string) {
    try {
      await api.delete(`/admin/diffusions/${id}`);
      setGroups((arr) => arr.filter((g) => g.id !== id));
      if (editingId === id) setEditingId(null);
      notifySuccess("Groupe supprimé.");
    } catch (e: unknown) {
      notifyError(errMsg(e, "Suppression impossible"));
    }
  }

  if (editing) {
    return (
      <DiffusionEditor
        value={editing}
        onChange={updateEditing}
        onSave={saveEditing}
        onBack={() => setEditingId(null)}
      />
    );
  }

  return (
    <DiffusionList
      items={groups}
      onCreate={createGroup}
      onOpen={(id) => setEditingId(id)}
      onDelete={deleteGroup}
    />
  );
}
