import type { GenerateAffiliationResponse, GetAffiliationMeResponse } from "@features/profile/types";
import { API_BASE } from "./client";

export async function apiGetAffiliationMe(token?: string): Promise<GetAffiliationMeResponse> {
  const res = await fetch(`${API_BASE}/affiliation/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Impossible de récupérer l’affiliation.");
  return res.json();
}

export async function apiGenerateAffiliation(token?: string): Promise<GenerateAffiliationResponse> {
  const res = await fetch(`${API_BASE}/affiliation/generate`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    credentials: "include",
  });
  if (!res.ok) throw new Error("Génération du lien impossible.");
  return res.json();
}