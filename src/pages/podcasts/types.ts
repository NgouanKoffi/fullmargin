// Type utilisé par l’UI (cartes, lecteur, détail)
export type Podcast = {
  id: string;
  title: string;
  artist: string; // <- mappé depuis author
  cover: string; // <- mappé depuis coverUrl
  durationSec: number; // <- mappé depuis duration (en secondes)
  description: string; // <- description texte (html nettoyé)
  // Infos complémentaires (utiles pour DetailView / lecteur)
  audioUrl?: string;
  category?: string;
  publishedAt?: string; // ⚠️ plus de `null` ici -> compat ExtraPodcast

  // 🆕 Compteurs (optionnels sur certains écrans)
  likesCount?: number;
  dislikesCount?: number;
  viewsCount?: number;
  savesCount?: number;
};

export type SidebarItem = {
  label: string;
  icon: React.ElementType;
};
