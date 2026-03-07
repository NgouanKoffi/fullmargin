// src/pages/communaute/private/community-details/tabs/DirectTab/types.ts

export type LiveStatus = "scheduled" | "live" | "ended" | "cancelled";

export type CommunityLive = {
  id: string;
  communityId: string;
  title: string;
  description: string;
  status: LiveStatus;
  startsAt: string | null;
  roomName: string;
  endedAt?: string | null;
  isPublic?: boolean;
};
