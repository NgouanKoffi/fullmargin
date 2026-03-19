// src/pages/admin/Messages/MailboxTab/panels/MailComposer.ts
// simple re-export — pas de logique ici

export { default } from "./MailerComposer";

// ⬇️ type-only re-exports (n’affecte pas react-refresh)
export type {
  GroupOption,
  SenderOption,
  ComposerResult,
  Attachment,
  AttachmentKind,
} from "./MailerComposer/types";
