// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\lib\shopApi.ts
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

export type Shop = {
  id: string;
  name: string;
  desc: string;
  signature: string;
  avatarUrl: string;
  coverUrl: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Construit des headers propres */
function buildAuthHeaders(): Headers {
  const h = new Headers();
  const s = loadSession();
  if (s?.token) h.set("Authorization", `Bearer ${s.token}`);
  return h;
}

export async function getMyShop(): Promise<Shop | null> {
  const headers = buildAuthHeaders();
  const res = await fetch(`${API_BASE}/marketplace/shops/me`, {
    headers,
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to load shop");
  const json = await res.json();
  return json?.data?.shop ?? null;
}

export async function createShop(payload: {
  name: string;
  desc: string;
  signature: string;
  avatarUrl?: string;
  coverUrl?: string;
}) {
  const headers = buildAuthHeaders();
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}/marketplace/shops`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || "Création impossible");
  }
  const json = await res.json();
  return json?.data as { id: string; slug?: string; updatedAt?: string };
}

export async function updateShop(id: string, patch: Partial<Shop>) {
  const headers = buildAuthHeaders();
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${API_BASE}/marketplace/shops/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(patch),
  });

  if (!res.ok) throw new Error("Sauvegarde impossible");
  const json = await res.json();
  return json?.data as { updatedAt?: string; slug?: string };
}

export async function deleteShop(id: string) {
  const headers = buildAuthHeaders();

  const res = await fetch(`${API_BASE}/marketplace/shops/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!res.ok) throw new Error("Suppression impossible");
  return true;
}
