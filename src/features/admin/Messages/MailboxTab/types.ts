export type Folder = "inbox" | "sent" | "trash";

export type Mail = {
  id: string;
  folder: Folder;
  fromName: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  snippet: string;
  date: string; // ISO
  starred?: boolean;
  unread?: boolean;
  bodyHtml: string;
};