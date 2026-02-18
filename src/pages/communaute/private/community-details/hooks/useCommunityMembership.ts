// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\private\community-details\hooks\useCommunityMembership.ts
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../../../lib/api";

type Membership = "none" | "pending" | "approved";

export function useCommunityMembership({
  communityId,
  isOwner,
}: {
  communityId?: string;
  isOwner: boolean;
}) {
  const [membershipStatus, setMembershipStatus] = useState<Membership>("none");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!communityId || isOwner) return;
      try {
        const raw = localStorage.getItem("fm:session");
        const tok: string | undefined = raw ? JSON.parse(raw).token : undefined;
        const headers: Record<string, string> = {};
        if (tok) headers.Authorization = `Bearer ${tok}`;

        const r = await fetch(
          `${API_BASE}/communaute/memberships/status/${communityId}`,
          {
            headers,
            cache: "no-store",
          }
        );
        const j = await r.json();
        if (!cancelled && j?.ok) {
          setMembershipStatus(j.data?.status as Membership);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [communityId, isOwner]);

  const canAccessPrivates = useMemo(
    () => isOwner || membershipStatus === "approved",
    [isOwner, membershipStatus]
  );

  return { membershipStatus, canAccessPrivates };
}
