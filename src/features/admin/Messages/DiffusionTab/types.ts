// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\Messages\DiffusionTab\types.ts
export type Segments = {
  everyone: boolean;
  agents: boolean;
  communityOwners: boolean; // désactivé (bientôt)
  shopOwners: boolean; // désactivé (bientôt)
  custom: boolean;
  customEmails: string[];
};

export type DiffusionGroup = {
  id?: string; // alias pratique
  _id?: string; // id Mongo brut
  name: string;
  description?: string;
  segments: Segments;
  snapshotEmails?: string[];
  recipientCount?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
};
