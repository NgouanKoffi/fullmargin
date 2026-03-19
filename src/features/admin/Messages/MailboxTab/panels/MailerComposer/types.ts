export type GroupOption = { id: string; name: string };
export type SenderOption = { id: string; name: string; email: string };

export type ComposerResult = {
  from: { id: string; name: string; email: string };
  groups: string[];
  toEmails: string[];
  subject: string;
  bodyHtml: string;
  sendAt?: string | null;
  attachments: File[];
};

export type AttachmentKind = "image" | "pdf" | "doc" | "sheet" | "other";
export type Attachment = {
  id: string;
  file: File;
  url: string;
  kind: AttachmentKind;
};
