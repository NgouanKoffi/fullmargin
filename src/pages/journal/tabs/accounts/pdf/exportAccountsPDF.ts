import type { Account } from "../../../api";
import type { Currency } from "../../../types";
import { fmtMoney } from "../../../utils";

type Stat = {
  invested: number;
  gain: number;
  loss: number;
  net: number;
  trades: number;
  wins: number;
  breakeven: number;
};
type SeriesMap = Map<
  string,
  Stat & { series: Array<{ x: number; y: number }> }
>;

export default function exportAccountsPDF({
  filtered,
  statsByAcc,
  from,
  to,
  query,
  landscape = true,
}: {
  filtered: Account[];
  statsByAcc: SeriesMap;
  from: string;
  to: string;
  query: string;
  landscape?: boolean;
}) {
  const LOGO_URL = `${window.location.origin}/logo.svg`;
  const escapeHtml = (s: unknown) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const today = new Date().toLocaleString("fr-FR");
  const period =
    (from ? `du ${from}` : "") + (to ? `${from ? " " : ""}au ${to}` : "");
  const filters =
    [period && `Période ${period}`, query && `Filtre: “${query}”`]
      .filter(Boolean)
      .join(" · ") || "Tous les comptes";

  const chunk = <T>(arr: T[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );

  const renderCard = (a: Account) => {
    const s = statsByAcc.get(a.id);
    const st: Stat = s
      ? {
          invested: s.invested,
          gain: s.gain,
          loss: s.loss,
          net: s.net,
          trades: s.trades,
          wins: s.wins,
          breakeven: s.breakeven,
        }
      : {
          invested: 0,
          gain: 0,
          loss: 0,
          net: 0,
          trades: 0,
          wins: 0,
          breakeven: 0,
        };

    const bal = a.initial + (st.net || 0);
    const grad =
      a.currency === "USD"
        ? "linear-gradient(135deg,#6366F1,#0EA5E9)"
        : a.currency === "EUR"
        ? "linear-gradient(135deg,#10B981,#84CC16)"
        : "linear-gradient(135deg,#A855F7,#EC4899)";

    return `
      <article class="card">
        <div class="stripe" style="background:${grad}"></div>
        <div class="card-head">
          <div class="title">${escapeHtml(a.name)}</div>
          <div class="pill">${escapeHtml(a.currency)}</div>
        </div>
        <div class="muted">ID: ${escapeHtml(a.id)}</div>
        <div class="grid2">
          <div><b>Solde initial:</b> ${escapeHtml(
            fmtMoney(a.initial, a.currency as Currency)
          )}</div>
          <div><b>Solde actuel:</b> <span class="${
            bal < 0 ? "neg" : "pos"
          }">${escapeHtml(fmtMoney(bal, a.currency as Currency))}</span></div>
          <div><b>Trades:</b> ${st.trades}</div>
          <div><b>Winrate:</b> ${
            st.trades ? ((st.wins / st.trades) * 100).toFixed(1) : "0.0"
          }%</div>
          <div><b>Investi:</b> ${escapeHtml(
            fmtMoney(st.invested, a.currency as Currency)
          )}</div>
          <div><b>PnL net:</b> <span class="${
            st.net < 0 ? "neg" : "pos"
          }">${escapeHtml(
      fmtMoney(st.net, a.currency as Currency)
    )}</span></div>
        </div>
        <div class="muted small">Créé le ${escapeHtml(
          new Date(a.createdAt).toLocaleString("fr-FR")
        )}</div>
      </article>`;
  };

  const pagesHtmlCards = chunk(filtered, 4)
    .map(
      (group) =>
        `<section class="page">${group.map(renderCard).join("")}</section>`
    )
    .join("");

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Comptes du journal – PDF</title>
<style>
  @page { size: A4 ${landscape ? "landscape" : ""}; margin: 14mm 12mm 24mm; }
  html,body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font: 11px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Helvetica Neue",Arial,"Noto Sans",sans-serif; color:#0f172a; }
  h1 { font-size: 16px; margin: 0 0 2px 0; letter-spacing: -.2px; }
  .muted { color:#64748b; margin: 0 0 8px 0; }
  .muted.small { font-size: 10px; margin-top: 6px; }
  .brand { display:flex; align-items:center; gap:10px; margin: 0 0 8px 0; }
  .brand img { height: 18px; }
  :root { --gap: 6mm; --card-h: 62mm; }
  .cards { display:block; }
  .page { display:grid; grid-template-columns: 1fr 1fr; grid-auto-rows: var(--card-h); gap: var(--gap); break-after: page; }
  .page:last-child { break-after: auto; }
  .card { box-sizing: border-box; border: 1px solid #dbe2ea; border-radius: 12px; background: #fff; padding: 8px 10px 10px; position: relative; height: var(--card-h); overflow: hidden; }
  .stripe { position:absolute; left:0; top:0; height:3px; right:0; border-radius:12px 12px 0 0; }
  .card-head { display:flex; align-items:center; justify-content:space-between; margin-top: 5px; }
  .title { font-weight: 700; font-size: 12px; margin-right:8px; }
  .pill { font-size: 10px; font-weight:700; padding: 1px 6px; border-radius: 999px; background:#eef2ff; color:#1e293b; border:1px solid #c7d2fe; }
  .grid2 { display:grid; grid-template-columns: 1fr 1fr; gap: 4px 12px; margin-top: 6px; }
  .pos { color: #047857; } .neg { color:#b91c1c; }
  .signature { position: fixed; left: 12mm; right: 12mm; bottom: 8mm; display:flex; align-items:center; justify-content: space-between; font-size: 10px; color:#64748b; border-top: 1px solid #e2e8f0; padding-top: 4px; }
  .signature .right { display:flex; align-items:center; gap:8px; }
  .signature img { height: 14px; }
</style></head>
<body>
  <div class="brand">
    <img src="${LOGO_URL}" alt="FullMargin" onerror="this.style.display='none'"/>
    <div>
      <h1>Comptes du journal</h1>
      <div class="muted">${escapeHtml(filters)} — exporté le ${escapeHtml(
    today
  )}</div>
    </div>
  </div>
  <div class="cards">${
    pagesHtmlCards || `<div class="muted">Aucun compte pour ces filtres.</div>`
  }</div>
  <div class="signature">
    <span>© ${new Date().getFullYear()} FullMargin</span>
    <span class="right">
      <img src="${LOGO_URL}" alt="FullMargin" onerror="this.style.display='none'"/>
      Fait sur <b>www.fullmargin.net</b>
    </span>
  </div>
</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) return;

  doc.open();
  doc.write(html);
  doc.close();
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => iframe.remove(), 600);
    }, 200);
  };
}
