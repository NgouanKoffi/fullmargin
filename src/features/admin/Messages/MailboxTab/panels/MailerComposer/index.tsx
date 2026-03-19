// exporte LOCAL, pas depuis le parent
export { default } from "./MailerComposer";

// 👉 re-export des types en type-only (aucun runtime export, donc OK pour la règle)
export type {
  GroupOption,
  SenderOption,
  ComposerResult,
  AttachmentKind,
  Attachment,
} from "./types";
