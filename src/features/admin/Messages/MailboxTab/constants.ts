// src/pages/admin/Messages/MailboxTab/constants.ts
import type { ComponentType } from "react";
import type { Folder } from "./types";
import { Inbox, Send } from "lucide-react";

export const DEFAULT_FOLDER: Folder = "inbox";

export type FolderDef = {
  key: Folder;
  label: string;
  Icon: ComponentType<{ className?: string }>;
};

/** Défs utilisées par MailTabsBar pour afficher les onglets */
export const FOLDER_DEFS: FolderDef[] = [
  { key: "inbox", label: "Inbox",    Icon: Inbox },
  { key: "sent",  label: "Envoyés",  Icon: Send },
];