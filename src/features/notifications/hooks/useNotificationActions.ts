import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "@core/api/client";
import { loadSession } from "@core/auth/lib/storage";
import { NON_CLICKABLE_TYPES, type Notification } from "../constants";
import type { PostLite } from "@shared/components/feed/types";

export function useNotificationActions(markAsRead: (id: string) => void) {
  const navigate = useNavigate();

  const [modalPost, setModalPost] = useState<PostLite | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  const openPostModal = useCallback(async (postId: string) => {
    setModalLoading(true);
    try {
      const token = loadSession()?.token;
      const base = API_BASE.replace(/\/+$/, "");
      const res = await fetch(
        `${base}/communaute/posts/${encodeURIComponent(postId)}`,
        {
          headers: {
            Accept: "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        }
      );
      if (!res.ok) return;
      const json = (await res.json()) as { ok?: boolean; data?: PostLite };
      if (json?.ok && json.data) {
        setModalPost(json.data);
      }
    } catch {
      // ignore
    } finally {
      setModalLoading(false);
    }
  }, []);

  const handleNotificationClick = (notif: Notification) => {
    if (NON_CLICKABLE_TYPES.includes(notif.kind)) {
      if (!notif.seen) markAsRead(notif.id);
      return;
    }

    if (!notif.seen) markAsRead(notif.id);

    const kind = notif.kind;
    const payload = notif.payload || {};

    if (
      kind === "community_live_started" ||
      kind === "community_live_scheduled"
    ) {
      const liveId = payload.liveId as string | undefined;
      if (liveId) return navigate(`/communaute/direct/${liveId}`);
      const slug = payload.communitySlug || notif.communityId;
      return navigate(slug ? `/communaute/${slug}` : "/communautes");
    }

    const postKinds = [
      "community_post_commented",
      "community_comment_replied",
      "community_post_liked",
      "community_post_created",
      "community_post_created_admin",
      "community_post_deleted_by_admin",
      "community_comment_deleted",
    ];
    if (postKinds.includes(kind)) {
      const postId = (payload.postId || payload.relatedPostId) as
        | string
        | undefined;
      if (postId) openPostModal(postId);
      return;
    }

    if (kind === "community_request_received") {
      const slug = (payload.communitySlug as string | undefined) || notif.communityId;
      return navigate(
        slug
          ? `/communaute/${slug}?tab=demandes&sub=incoming&mstatus=pending&istatus=pending`
          : "/communaute"
      );
    }

    if (
      kind === "community_request_approved" ||
      kind === "community_request_rejected"
    ) {
      const slug = (payload.communitySlug as string | undefined) || notif.communityId;
      return navigate(slug ? `/communaute/${slug}` : "/communaute");
    }

    if (
      [
        "community_course_created",
        "community_course_enrolled",
        "community_course_unenrolled",
        "course_manual_enrollment",
        "course_manual_unenrollment",
        "course_sale_made",
      ].includes(kind)
    ) {
      if (kind === "course_sale_made")
        return navigate("/communaute/mon-espace?tab=ventes");
      const courseId = payload.courseId as string | undefined;
      if (courseId) return navigate(`/communaute/formation/${courseId}`);
      const slug = (payload.communitySlug as string | undefined) || notif.communityId;
      return navigate(slug ? `/communaute/${slug}` : "/communautes");
    }

    if (
      [
        "community_group_created",
        "community_group_member_added",
        "community_group_member_removed",
        "group_manual_add_member",
        "group_manual_remove_member",
      ].includes(kind)
    ) {
      const groupId = payload.groupId as string | undefined;
      const groupName = (payload.groupName as string | undefined) || "Groupe";
      if (groupId) {
        window.dispatchEvent(
          new CustomEvent("fm:open-messages", {
            detail: { groupId, name: groupName, avatar: undefined },
          })
        );
      } else {
        const cid = (payload.communityId as string | undefined) || notif.communityId;
        navigate(cid ? `/communaute/${cid}` : "/communautes");
      }
      return;
    }

    if (kind.startsWith("community_")) {
      const cid = (payload.communityId as string | undefined) || notif.communityId;
      return navigate(cid ? `/communaute/${cid}` : "/communautes");
    }

    if (kind === "marketplace_sale_made")
      return navigate("/marketplace/dashboard?tab=ventes");

    if (
      [
        "marketplace_product_submitted",
        "marketplace_product_approved",
        "marketplace_product_rejected",
        "marketplace_purchase_made",
      ].includes(kind)
    ) {
      return navigate("/marketplace/dashboard?tab=products");
    }

    if (kind.startsWith("fmmetrix_") || kind.startsWith("fmmetrix."))
      return navigate("/fm-metrix/historique");

    if (kind.startsWith("finance_withdrawal_"))
      return navigate("/wallet/withdraw?tab=history");

    if (kind === "admin_withdrawal_pending")
      return navigate("/admin/wallet/withdrawals");
    if (kind === "admin_product_pending")
      return navigate("/admin/marketplace?filter=pending");
    if (kind === "admin_fmmetrix_crypto_pending")
      return navigate("/admin/fullmetrix?tab=pending");
    if (kind === "admin_marketplace_crypto_pending")
      return navigate("/admin/marketplace-crypto");
  };

  return {
    handleNotificationClick,
    modalPost,
    setModalPost,
    modalLoading,
  };
}
