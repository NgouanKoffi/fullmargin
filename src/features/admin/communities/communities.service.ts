// src/features/admin/communities/communities.service.ts
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";
import type { CommunityItem, CourseItem, PostItem } from "./types";

function authHeader(): Record<string, string> {
  const token = loadSession()?.token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", ...authHeader() };
}

export async function fetchCommunities(): Promise<CommunityItem[]> {
  const res = await fetch(`${API_BASE}/admin/communities`, { headers: authHeader() });
  const data = await res.json();
  return data.ok ? data.data?.items ?? [] : [];
}

export async function fetchDeletionRequests(): Promise<CommunityItem[]> {
  const res = await fetch(`${API_BASE}/admin/communities?status=deletion_requested`, {
    headers: authHeader(),
  });
  const data = await res.json();
  return data.ok ? data.data?.items ?? [] : [];
}

export async function fetchCourses(): Promise<CourseItem[]> {
  const res = await fetch(`${API_BASE}/communaute/courses?all=1`, { headers: authHeader() });
  const data = await res.json();
  return data.ok ? data.data?.items ?? [] : [];
}

export async function fetchPosts(communityId?: string): Promise<PostItem[]> {
  const url = communityId 
    ? `${API_BASE}/admin/moderate/posts?communityId=${communityId}`
    : `${API_BASE}/admin/moderate/posts`;
  const res = await fetch(url, { headers: authHeader() });
  const data = await res.json();
  return data.ok ? data.posts ?? [] : [];
}

export async function approveDeletion(id: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/admin/communities/${id}/approve-deletion`, {
    method: "POST",
    headers: authHeader(),
  });
  return res.json();
}

export async function approveRestoration(id: string): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/admin/communities/${id}/approve-restoration`, {
    method: "POST",
    headers: authHeader(),
  });
  return res.json();
}

export async function suspendItem(
  id: string,
  type: "community" | "course" | "post",
  reason: string
): Promise<{ ok: boolean; error?: string }> {
  let endpoint = "/admin/moderate/community";
  if (type === "course") endpoint = "/admin/moderate/course";
  if (type === "post")   endpoint = "/admin/moderate/post";
  
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ id, reason }),
  });
  return res.json();
}

export async function sendWarning(
  id: string,
  reason: string
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/admin/communities/${id}/warnings`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ reason }),
  });
  return res.json();
}
