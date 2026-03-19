// src/pages/admin/Messages/MailboxTab/panels/MailReadScreen.tsx
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Reply,
  Clipboard,
  Download,
  Paperclip,
  Eye,
} from "lucide-react";

const fmtDate = (iso: string | Date) =>
  new Date(iso).toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

type Attachment = { name?: string; type?: string; size?: number; url?: string };

type ReplySeed = {
  to: string[];
  subject: string;
  html: string;
  senderId?: string;
};

type Props = {
  mail: {
    id: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    date: string | Date;
    toEmails?: string[];
    bodyHtml?: string;
    bodyText?: string;
    attachments?: Attachment[];
  };
  onBack: () => void;
  onReply: (seed: ReplySeed) => void; // ⬅️ seed pour préremplir le composer
};

/* ---------- UI helpers ---------- */
function RecipientChip({ email }: { email: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs ring-1 ring-skin-border/40 bg-skin-tile"
      title={email}
    >
      {email}
    </span>
  );
}
const isImage = (a?: Attachment) =>
  !!(
    a?.type?.startsWith("image/") ||
    (a?.name && /\.(png|jpe?g|gif|webp|svg)$/i.test(a.name))
  );
const isPdf = (a?: Attachment) =>
  a?.type === "application/pdf" || (a?.name && /\.pdf$/i.test(a.name));

function humanSize(n?: number) {
  if (!n || n <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let x = n;
  let i = 0;
  while (x >= 1024 && i < units.length - 1) {
    x /= 1024;
    i++;
  }
  return `${x.toFixed(x >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/* ---------- Pièce jointe : vignette image ---------- */
function ImageThumb({ a }: { a: Attachment }) {
  return (
    <div className="group relative overflow-hidden rounded-xl ring-1 ring-skin-border/30 bg-skin-tile">
      <img
        src={a.url}
        alt={a.name || "image"}
        className="w-full h-32 sm:h-36 md:h-40 object-cover"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 px-2 py-1 text-[11px] truncate bg-skin-surface/80 backdrop-blur">
        {a.name}
      </div>
      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
        {a.url && (
          <a
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ring-skin-border/40 bg-skin-surface/90 hover:bg-skin-surface"
            title="Aperçu"
          >
            <Eye className="w-3.5 h-3.5" />
            Aperçu
          </a>
        )}
        {a.url && (
          <a
            href={a.url}
            download
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ring-1 ring-skin-border/40 bg-skin-surface/90 hover:bg-skin-surface"
            title="Télécharger"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger
          </a>
        )}
      </div>
    </div>
  );
}

/* ---------- Pièce jointe : fichier non-image ---------- */
function FileRow({ a }: { a: Attachment }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl ring-1 ring-skin-border/20 p-3 hover:bg-skin-tile">
      <div className="min-w-0">
        <div className="text-sm truncate">{a.name || "fichier"}</div>
        <div className="text-xs text-skin-muted">
          {isPdf(a) ? "PDF" : a.type || "fichier"}{" "}
          {a.size ? `· ${humanSize(a.size)}` : ""}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {a.url && (
          <a
            href={a.url}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs rounded ring-1 ring-skin-border/40 hover:bg-skin-tile"
            title="Aperçu"
          >
            <Eye className="w-3.5 h-3.5" />
            Aperçu
          </a>
        )}
        {a.url && (
          <a
            href={a.url}
            download
            className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded ring-1 ring-skin-border/40 hover:bg-skin-tile"
            title="Télécharger"
          >
            <Download className="w-3.5 h-3.5" />
            Télécharger
          </a>
        )}
      </div>
    </div>
  );
}

/* ---------- Helpers réponse ---------- */
function withRe(s?: string) {
  const t = (s || "(Sans objet)").trim();
  return /^re\s*:/i.test(t) ? t : `Re: ${t}`;
}
function guessSenderIdFromTo(list?: string[]) {
  const L = (list || []).map((x) => x.toLowerCase());
  if (L.includes("noreply@fullmargin.net")) return "noreply";
  if (L.includes("podcast@fullmargin.net")) return "podcast";
  return undefined;
}

export default function MailReadScreen({ mail, onBack, onReply }: Props) {
  /* --- Back via Esc --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onBack();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBack]);

  /* --- Destinataires --- */
  const allRecipients = useMemo(() => mail.toEmails ?? [], [mail.toEmails]);
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? allRecipients : allRecipients.slice(0, 4);
  const hidden = Math.max(0, allRecipients.length - shown.length);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(allRecipients.join(", "));
    } catch (err) {
      // on ignore l'erreur (navigateur sans permission presse-papier, etc.)
      console.debug("copyAll() clipboard write failed:", err);
    }
  }

  /* --- Corps --- */
  const hasHtml = !!mail.bodyHtml && mail.bodyHtml.trim().length > 0;
  const hasText = !!mail.bodyText && mail.bodyText.trim().length > 0;

  /* --- Pièces jointes : reset à chaque mail.id --- */
  const attachments = useMemo<Attachment[]>(
    () => (Array.isArray(mail.attachments) ? [...mail.attachments] : []),
    [mail.attachments]
  );

  const imageAtts = attachments.filter(isImage);
  const otherAtts = attachments.filter((a) => !isImage(a));

  const [showAllImages, setShowAllImages] = useState(false);
  useEffect(() => {
    setShowAllImages(false);
    setExpanded(false);
  }, [mail.id]);

  const imagesToShow = showAllImages ? imageAtts : imageAtts.slice(0, 4);
  const moreImages = Math.max(0, imageAtts.length - imagesToShow.length);

  /* --- Construire le brouillon de réponse --- */
  const buildQuotedHtml = () => {
    const dateStr = fmtDate(mail.date);
    const header = `<p style="margin:12px 0;color:#64748b">Le ${dateStr}, ${mail.fromName} &lt;${mail.fromEmail}&gt; a écrit :</p>`;
    const quoted =
      mail.bodyHtml && mail.bodyHtml.trim().length
        ? `<blockquote style="margin:0;border-left:3px solid #e5e7eb;padding-left:12px">${mail.bodyHtml}</blockquote>`
        : `<blockquote style="margin:0;border-left:3px solid #e5e7eb;padding-left:12px;white-space:pre-wrap">${
            mail.bodyText || "<em>(Pas de contenu)</em>"
          }</blockquote>`;
    return `<p>Bonjour,</p><p>…</p>${header}${quoted}<p>— L’équipe FullMargin</p>`;
  };

  const handleReplyClick = () => {
    const to = mail.fromEmail?.trim()
      ? [mail.fromEmail.trim()]
      : mail.toEmails && mail.toEmails.length
      ? [mail.toEmails[0]]
      : [];
    onReply({
      to,
      subject: withRe(mail.subject),
      html: buildQuotedHtml(),
      senderId: guessSenderIdFromTo(mail.toEmails),
    });
  };

  return (
    <div className="relative rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface overflow-hidden grid grid-rows-[auto,1fr]">
      {/* Topbar */}
      <div className="flex items-center gap-2 px-2 sm:px-4 py-2 border-b border-skin-border/15">
        <button
          onClick={onBack}
          className="rounded-xl p-2 hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Retour"
          title="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">
            {mail.subject || "(Sans objet)"}
          </div>

          <div className="text-xs text-skin-muted">
            {mail.fromName} &lt;{mail.fromEmail}&gt; • {fmtDate(mail.date)}
          </div>

          <div className="mt-1 text-xs text-skin-muted flex items-center gap-2 flex-wrap">
            <span className="text-skin-base/80">À :</span>
            {allRecipients.length === 0 ? (
              <span className="italic text-skin-muted">—</span>
            ) : (
              <>
                <div className="flex items-center gap-1 flex-wrap">
                  {shown.map((e, i) => (
                    <RecipientChip key={`${e}-${i}`} email={e} />
                  ))}
                  {hidden > 0 && !expanded && (
                    <button
                      onClick={() => setExpanded(true)}
                      className="text-[11px] px-2 py-0.5 rounded-full ring-1 ring-skin-border/40 hover:bg-skin-tile"
                      title={allRecipients.join(", ")}
                    >
                      +{hidden} autre{hidden > 1 ? "s" : ""}
                    </button>
                  )}
                </div>
                {allRecipients.length > 0 && (
                  <button
                    onClick={copyAll}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:bg-black/5 dark:hover:bg-white/10"
                    title="Copier tous les destinataires"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    Copier
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Corps (scrollable) */}
      <div className="overflow-auto p-4 sm:p-6 pb-28">
        {hasHtml ? (
          <div
            className="prose prose-sm mx-auto max-w-none"
            dir="auto"
            style={{ textAlign: "start" }}
            dangerouslySetInnerHTML={{ __html: mail.bodyHtml! }}
          />
        ) : hasText ? (
          <pre
            className="max-w-3xl mx-auto whitespace-pre-wrap text-sm text-skin-base/90"
            dir="auto"
            style={{ textAlign: "start" }}
          >
            {mail.bodyText}
          </pre>
        ) : (
          <div className="max-w-3xl mx-auto text-sm text-skin-muted italic">
            — Pas de contenu —
          </div>
        )}

        {/* Pièces jointes */}
        {attachments.length > 0 && (
          <div className="max-w-3xl mx-auto mt-6">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium">
              <Paperclip className="w-4 h-4" />
              Pièces jointes{" "}
              <span className="text-skin-muted">({attachments.length})</span>
            </div>

            {/* Images */}
            {imageAtts.length > 0 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
                  {imagesToShow.map((a, i) => (
                    <ImageThumb key={`${a.url || a.name}-${i}`} a={a} />
                  ))}
                </div>
                {moreImages > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowAllImages(true)}
                      className="text-xs rounded-full px-3 py-1 ring-1 ring-skin-border/40 hover:bg-skin-tile"
                    >
                      Afficher toutes les images (+{moreImages})
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Autres fichiers */}
            {otherAtts.length > 0 && (
              <div className="space-y-2">
                {otherAtts.map((a, i) => (
                  <FileRow key={`${a.url || a.name}-file-${i}`} a={a} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* FAB: Répondre */}
        <div className="sticky bottom-0 left-0 right-0 z-10 pointer-events-none mt-6">
          <div className="bg-gradient-to-t from-skin-surface via-skin-surface/95 to-transparent h-12 -mb-3" />
          <div className="flex justify-end pr-1 sm:pr-2 pb-[env(safe-area-inset-bottom)]">
            <button
              onClick={handleReplyClick}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2 shadow-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/40"
              title="Répondre"
              aria-label="Répondre"
            >
              <Reply className="w-4 h-4" />
              <span className="hidden xs:inline">Répondre</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
