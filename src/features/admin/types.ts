// src/types/admin/users.ts

export type PresenceLite = {
    status: "online" | "away" | "offline";
    lastPingAt?: string;
    lastOnlineAt?: string;
    totalOnlineMs?: number;
  };
  
  export type UserRow = {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
    roles: string[];
    isActive?: boolean;
    createdAt?: string;
    extra?: { city?: string; country?: string };
    presence?: PresenceLite | null;
  };  