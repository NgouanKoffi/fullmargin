export const LS_KEY_GROUPS = "admin:mail:diffusion:groups";

export const DEFAULT_CATEGORIES = [
  "Annonce",
  "Nouveautés",
  "Maintenance",
  "Marketing",
  "Communauté",
  "Boutiques",
];

export const SEGMENT_LABELS: Record<
  "everyone" | "agents" | "communityOwners" | "shopOwners" | "custom",
  string
> = {
  everyone: "Tout le monde",
  agents: "Agents",
  communityOwners: "Propriétaire de communauté",
  shopOwners: "Propriétaire de boutique",
  custom: "Personnaliser",
};
