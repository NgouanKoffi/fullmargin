// src/pages/profil/hooks/useProfileState.ts
import { useMemo, useState } from "react";
import type { ProfileExtra, Friend } from "../types";

/**
 * On accepte un user "léger" avec fullName, avatarUrl ET (optionnel) coverUrl.
 * Le call-site peut passer l'objet User complet; TypeScript est structurel, ça passe.
 */
export function useProfileState(user?: {
  fullName?: string;
  avatarUrl?: string;
  coverUrl?: string;
}) {
  const [extra, setExtra] = useState<ProfileExtra>({
    // ⚠️ NE PAS mettre d'URL par défaut ici : on laisse le rendu gérer le fallback.
    coverUrl: user?.coverUrl || "",
    avatarUrl: user?.avatarUrl || "",
    fullName: user?.fullName || "",
    phone: "",
    bio: "",
    country: undefined,
    city: "",
  });

  const [friends, setFriends] = useState<Friend[]>([
    { id: "1", name: "Aïcha Traoré",  avatar: "https://i.pravatar.cc/100?img=1",  mutual: 12, online: true,  location: "Abidjan" },
    { id: "2", name: "Yao Kouamé",    avatar: "https://i.pravatar.cc/100?img=5",  mutual: 4,  online: false, location: "Bouaké" },
    { id: "3", name: "Fatou Keïta",   avatar: "https://i.pravatar.cc/100?img=8",  mutual: 7,  online: true,  location: "Yamoussoukro" },
    { id: "4", name: "Junior Konan",  avatar: "https://i.pravatar.cc/100?img=12", mutual: 2,  online: false, location: "San-Pédro" },
    { id: "5", name: "Marie Djédjé",  avatar: "https://i.pravatar.cc/100?img=15", mutual: 15, online: true,  location: "Paris" },
    { id: "6", name: "Serge N'Guessan", avatar: "https://i.pravatar.cc/100?img=20", mutual: 9, online: true, location: "Daloa" },
  ]);

  const [friendQuery, setFriendQuery] = useState("");

  const filteredFriends = useMemo(
    () =>
      friends.filter((f) =>
        f.name.toLowerCase().includes(friendQuery.trim().toLowerCase())
      ),
    [friends, friendQuery]
  );

  return {
    extra,
    setExtra,
    friends,
    setFriends,
    friendQuery,
    setFriendQuery,
    filteredFriends,
  };
}