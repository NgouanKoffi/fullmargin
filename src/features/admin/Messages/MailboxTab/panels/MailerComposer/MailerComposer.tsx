// src/pages/admin/Messages/MailboxTab/panels/MailerComposer/MailerComposer.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  Attachment,
  ComposerResult,
  GroupOption,
  SenderOption,
} from "./types";
import { kindFor } from "./utils";
import GroupsPicker from "./parts/GroupsPicker";
import RecipientsInput from "./parts/RecipientsInput";
import Scheduler from "./parts/Scheduler";
import Attachments from "./parts/Attachments";
import Editor from "./parts/Editor";
import Topbar from "./parts/Topbar";
import useDiffusionGroupsOptions from "./hooks/useDiffusionGroupsOptions";
import { useAuth } from "@core/auth/AuthContext";

type ComposerSeed = {
  to?: string[];
  subject?: string;
  html?: string;
  senderId?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSend: (payload: ComposerResult) => Promise<void> | void;

  groupsOptions: GroupOption[];
  sendersOptions: SenderOption[];
  defaultSenderId?: string;

  /** Pré-remplissage (quand on clique “Répondre”) */
  seed?: ComposerSeed;
};

export default function MailerComposer({
  open,
  onClose,
  onSend,
  groupsOptions,
  sendersOptions,
  defaultSenderId,
  seed,
}: Props) {
  const { status, user } = useAuth();
  const roles = user?.roles ?? [];
  const isAgent = status === "authenticated" && roles.includes("agent");
  // const isAdmin = status === "authenticated" && roles.includes("admin");

  const [sending, setSending] = useState(false);

  // Groupes depuis API (fallback props)
  const { options: apiGroups } = useDiffusionGroupsOptions();
  const effectiveGroups = apiGroups.length ? apiGroups : groupsOptions;

  // ——— Expéditeur (restreint pour agent) ———
  const PODCAST_ID = "podcast";
  const allowedSenders: SenderOption[] = isAgent
    ? sendersOptions.filter((s) => s.id === PODCAST_ID)
    : sendersOptions;

  const initialSenderId = isAgent
    ? PODCAST_ID
    : defaultSenderId ?? sendersOptions[0]?.id ?? "";

  const [senderId, setSenderId] = useState(initialSenderId);
  const selectedSender = useMemo(
    () => allowedSenders.find((s) => s.id === senderId) ?? allowedSenders[0],
    [senderId, allowedSenders]
  );

  // Audience
  const [groupIds, setGroupIds] = useState<string[]>([]);
  const [toEmails, setToEmails] = useState<string[]>([]);

  // planif
  const [sendAt, setSendAt] = useState<string>("");

  // contenu
  // ❌ Ancien défaut : "<p>Bonjour...</p>"
  // ✅ Maintenant vide par défaut
  const DEFAULT_HTML = "";
  const [subject, setSubject] = useState("");
  const [tab, setTab] = useState<"rich" | "html">("rich");
  const [html, setHtml] = useState(DEFAULT_HTML);

  // pièces jointes
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  function onFiles(files: FileList | null) {
    if (!files || !files.length) return;
    const next: Attachment[] = [];
    Array.from(files).forEach((f) =>
      next.push({
        id: Math.random().toString(36).slice(2),
        file: f,
        url: URL.createObjectURL(f),
        kind: kindFor(f),
      })
    );
    setAttachments((arr) => [...arr, ...next]);
  }
  function onRemoveAttachment(id: string) {
    setAttachments((arr) => {
      const a = arr.find((x) => x.id === id);
      if (a) URL.revokeObjectURL(a.url);
      return arr.filter((x) => x.id !== id);
    });
  }
  useEffect(
    () => () => attachments.forEach((a) => URL.revokeObjectURL(a.url)),
    [attachments]
  );

  // lock scroll
  useEffect(() => {
    if (!open) return;
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
    };
  }, [open]);

  // Appliquer la seed UNIQUEMENT quand on ouvre le composer
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      // ⚠️ Agent → force toujours podcast
      const forcedSender = isAgent
        ? PODCAST_ID
        : seed?.senderId ?? initialSenderId;

      setSenderId(forcedSender);
      setGroupIds([]);
      setToEmails(seed?.to ?? []);
      setSubject(seed?.subject ?? "");
      // ✅ pas de message par défaut : si pas de seed, on met vide
      setHtml(seed?.html ?? "");
      setAttachments([]);
    }
    wasOpen.current = open;
  }, [open, seed, initialSenderId, isAgent]);

  // Si rôle/allowedSenders changent, forcer podcast pour agent
  useEffect(() => {
    if (isAgent && senderId !== PODCAST_ID) setSenderId(PODCAST_ID);
  }, [isAgent, senderId]);

  // envoi
  const canSend = useMemo(() => {
    const audienceOk = groupIds.length > 0 || toEmails.length > 0;
    return (
      !!selectedSender &&
      audienceOk &&
      subject.trim().length > 1 &&
      html.trim().length > 0
    );
  }, [groupIds, toEmails, subject, html, selectedSender]);

  async function handleSend() {
    if (!canSend || sending) return;
    setSending(true);
    try {
      const fromSender = isAgent
        ? allowedSenders.find((s) => s.id === PODCAST_ID)!
        : selectedSender!;

      await onSend({
        from: {
          id: fromSender.id,
          name: fromSender.name,
          email: fromSender.email,
        },
        groups: groupIds,
        toEmails,
        subject: subject.trim(),
        bodyHtml: html,
        sendAt: sendAt || null,
        attachments: attachments.map((a) => a.file),
      });
    } finally {
      setSending(false);
    }
  }

  if (!open) return null;

  const node = (
    <div className="fixed inset-0 z-[9999] bg-black/35 backdrop-blur-sm">
      <div className="flex h-[100svh] sm:h-[100dvh] w-screen flex-col bg-skin-surface">
        <Topbar
          onClose={onClose}
          senderId={senderId}
          setSenderId={setSenderId}
          sendersOptions={allowedSenders}
          canSend={canSend}
          sending={sending}
          onSend={handleSend}
          disableSenderSelect={isAgent} // ⬅️ lock pour agent
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {/* gauche */}
            <div className="space-y-3 sm:space-y-4 min-w-0">
              <GroupsPicker
                groupIds={groupIds}
                setGroupIds={setGroupIds}
                groupsOptions={effectiveGroups}
              />
              <RecipientsInput toEmails={toEmails} setToEmails={setToEmails} />
              <Scheduler sendAt={sendAt} setSendAt={setSendAt} />
              <Attachments
                attachments={attachments}
                onFiles={onFiles}
                onRemove={onRemoveAttachment}
              />
            </div>

            {/* droite */}
            <div>
              <Editor
                subject={subject}
                setSubject={setSubject}
                tab={tab}
                setTab={setTab}
                html={html}
                setHtml={setHtml}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return node;
  return createPortal(node, document.body);
}
