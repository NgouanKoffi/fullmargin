// src/pages/profil/index.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { notifyError, notifySuccess } from "../../components/Notification";

import { useProfileState } from "./hooks/useProfileState";
import ProfileHeader from "./components/ProfileHeader";
import TabBar from "./components/TabBar";

import AboutTab from "./tabs/AboutTab";
import SecurityTab from "./tabs/SecurityTab";
import AffiliationTab from "./tabs/AffiliationTab";

import type { TabId } from "./types";
import { API_BASE, getAuthToken } from "../../lib/api";

function getUserCover(u: unknown): string | undefined {
  if (
    u &&
    typeof u === "object" &&
    "coverUrl" in (u as Record<string, unknown>)
  ) {
    const v = (u as { coverUrl?: unknown }).coverUrl;
    return typeof v === "string" ? v : undefined;
  }
  return undefined;
}

export default function ProfilePage() {
  const { status, user, refresh } = useAuth();
  const roles = useMemo(() => user?.roles ?? [], [user]);

  const { extra, setExtra } = useProfileState(user || undefined);

  /* ===== Flags sécurité depuis le backend (avec fallbacks sûrs) ===== */
  const isGoogleLinked = Boolean(user?.googleLinked);
  const localEnabled = user?.localEnabled ?? !isGoogleLinked;
  const twoFAEnabled = user?.twoFAEnabled ?? true;

  /* ===== Onglet via URL ===== */
  const location = useLocation();
  const navigate = useNavigate();

  const VALID_TABS: TabId[] = ["about", "friends", "security", "affiliation"];

  const getTabFromSearchNow = (): TabId => {
    const sp = new URLSearchParams(location.search);
    const t = (sp.get("tab") || "about") as TabId;
    return VALID_TABS.includes(t) ? t : "about";
  };

  const [tab, setTab] = useState<TabId>(getTabFromSearchNow);
  useEffect(() => {
    setTab(getTabFromSearchNow());
  });

  const pushTab = (t: TabId) => {
    const sp = new URLSearchParams(location.search);
    sp.set("tab", t);
    navigate(
      { pathname: location.pathname, search: sp.toString() },
      { replace: true }
    );
  };

  /* ===== ObjectURL cleanup (évite les fuites mémoire) ===== */
  const lastPreviewUrls = useRef<string[]>([]);
  const addPreviewUrl = (url: string) => {
    lastPreviewUrls.current.push(url);
  };
  useEffect(() => {
    return () => {
      lastPreviewUrls.current.forEach((u) => URL.revokeObjectURL(u));
      lastPreviewUrls.current = [];
    };
  }, []);

  /* ===== Synchronisation depuis le user (après refresh session) ===== */
  useEffect(() => {
    if (!user) return;
    setExtra((x) => ({
      ...x,
      // 🔥 toujours sync avec le backend
      avatarUrl: user.avatarUrl || "",
      coverUrl: getUserCover(user) || x.coverUrl,
      fullName: x.fullName || user.fullName,
    }));
  }, [user, setExtra]);

  /* ===== Helper upload (POST FormData "file") ===== */
  async function uploadImage(
    path: string,
    file: File
  ): Promise<{ ok: boolean; url?: string; error?: string }> {
    const token = getAuthToken();
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        return {
          ok: false,
          error: (data && (data.error || data.message)) || "Upload échoué",
        };
      }
      return { ok: true, url: data.url as string };
    } catch {
      return { ok: false, error: "Erreur réseau pendant l’upload" };
    }
  }

  /* ===== Upload handlers (aperçu instantané + upload serveur) ===== */
  const onUploadCover = async (f: File) => {
    const preview = URL.createObjectURL(f);
    addPreviewUrl(preview);
    setExtra((x) => ({ ...x, coverUrl: preview }));

    const { ok, url, error } = await uploadImage("/profile/cover", f);
    if (!ok) {
      notifyError(error || "Mise à jour de la couverture impossible.");
      return;
    }

    setExtra((x) => ({ ...x, coverUrl: url || x.coverUrl }));
    notifySuccess("Couverture mise à jour.");
    try {
      await refresh();
    } catch (err) {
      console.error("[refresh after cover upload] ", err);
    }
  };

  const onUploadAvatar = async (f: File) => {
    const preview = URL.createObjectURL(f);
    addPreviewUrl(preview);
    setExtra((x) => ({ ...x, avatarUrl: preview }));

    const { ok, url, error } = await uploadImage("/profile/avatar", f);
    if (!ok) {
      notifyError(error || "Mise à jour de l’avatar impossible.");
      return;
    }

    setExtra((x) => ({ ...x, avatarUrl: url || x.avatarUrl }));
    notifySuccess("Avatar mis à jour.");
    try {
      await refresh();
    } catch (err) {
      console.error("[refresh after avatar upload] ", err);
    }
  };

  if (status !== "authenticated") return null;

  /* ===== Fallbacks UI ===== */
  const DEFAULT_COVER =
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600&auto=format&fit=crop";

  const headerAvatar = extra.avatarUrl || user?.avatarUrl || "";
  const headerCover = extra.coverUrl || getUserCover(user) || DEFAULT_COVER;
  const headerFullName = extra.fullName || user?.fullName;

  return (
    <main className="relative z-10 mx-auto max-w-6xl px-3 sm:px-6 pb-10">
      <ProfileHeader
        coverUrl={headerCover}
        avatarUrl={headerAvatar}
        fullName={headerFullName}
        email={user?.email}
        roles={roles as string[]}
        onUploadCover={onUploadCover}
        onUploadAvatar={onUploadAvatar}
      />

      <TabBar tab={tab} onChange={pushTab} />

      <div className="mt-2 space-y-4">
        {tab === "about" && (
          <AboutTab
            extra={extra}
            setExtra={setExtra}
            userEmail={user?.email}
            userFullName={user?.fullName}
          />
        )}

        {tab === "affiliation" && <AffiliationTab />}

        {tab === "security" && (
          <SecurityTab
            isGoogleLinked={isGoogleLinked}
            localEnabled={localEnabled}
            twoFAEnabled={twoFAEnabled}
          />
        )}
      </div>
    </main>
  );
}
