import type { StrategyStats } from "./stats";

export function exportStrategiesPdf({
  strategies,
  statsByStrategy,
  currency,
  filterLabel,
}: {
  strategies: Array<{
    id: string;
    name: string;
    description?: string;
    createdAt: string;
  }>;
  statsByStrategy: Map<string, StrategyStats>;
  currency: string;
  filterLabel: string;
}) {
  const escapeHtml = (s: unknown) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const LOGO_URL =
    typeof window !== "undefined"
      ? `${window.location.origin}/logo.svg`
      : "/logo.svg";
  const today = new Date().toLocaleString("fr-FR");

  const groups: (typeof strategies)[] = [];
  for (let i = 0; i < strategies.length; i += 4) {
    groups.push(strategies.slice(i, i + 4));
  }

  const renderCard = (s: (typeof strategies)[number]) => {
    const st = statsByStrategy.get(s.id);
    const stats: StrategyStats = st || {
      trades: 0,
      wins: 0,
      breakeven: 0,
      invested: 0,
      gain: 0,
      loss: 0,
      net: 0,
      dd: 0,
      series: [],
    };
    const winrate = stats.trades
      ? ((stats.wins / stats.trades) * 100).toFixed(1)
      : "0.0";

    const fmt = (n: number) =>
      `${n.toLocaleString("fr-FR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${currency}`;

    return `
      <article class="card">
        <header class="card-hd">
          <div class="pill">STRAT</div>
          <div class="title" title="${escapeHtml(s.name)}">${escapeHtml(
      s.name
    )}</div>
          <div class="sub">${escapeHtml(
            new Date(s.createdAt).toLocaleString("fr-FR")
          )}</div>
        </header>
        <div class="desc">${escapeHtml(s.description || "—")}</div>
        <div class="stats">
          <div class="stat"><span class="lab">Trades</span><span class="val">${
            stats.trades
          }</span></div>
          <div class="stat"><span class="lab">Winrate</span><span class="val">${winrate}%</span></div>
          <div class="stat"><span class="lab">Gain</span><span class="val pos">${fmt(
            stats.gain
          )}</span></div>
          <div class="stat"><span class="lab">Perte</span><span class="val neg">${fmt(
            -stats.loss
          )}</span></div>
          <div class="stat"><span class="lab">PnL net</span><span class="val ${
            stats.net < 0 ? "neg" : "pos"
          }">${fmt(stats.net)}</span></div>
          <div class="stat"><span class="lab">Max DD</span><span class="val neg">${fmt(
            -stats.dd
          )}</span></div>
          <div class="stat"><span class="lab">Investi</span><span class="val">${fmt(
            stats.invested
          )}</span></div>
        </div>
        <div class="meta">ID : ${escapeHtml(s.id)}</div>
      </article>
    `;
  };

  const pagesHtml =
    groups.length === 0
      ? `<section class="page"><div class="muted">Aucune stratégie</div></section>`
      : groups
          .map(
            (g, i) => `
        <section class="page${i === groups.length - 1 ? " last" : ""}">
          <div class="grid">
            ${g.map(renderCard).join("")}
          </div>
        </section>
      `
          )
          .join("");

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Stratégies – PDF</title>
<style>
  @page { size: A4 landscape; margin: 14mm 12mm 22mm; }
  html,body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font: 11.5px/1.38 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Helvetica Neue",Arial,"Noto Sans",sans-serif; color:#0f172a; }
  .brand { display:flex; align-items:center; gap:8px; margin:0 0 6mm 0; }
  .brand img { height:18px; }
  h1 { font-size:17px; margin:0; letter-spacing:-.2px; }
  .muted { color:#64748b; margin-top:2px; }
  .page { break-after: page; page-break-after: always; }
  .page.last { break-after: auto; page-break-after: auto; }
  .grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:5mm; grid-auto-rows:64mm; }
  .card { height:100%; box-sizing:border-box; background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:8px; box-shadow:0 1px 0 rgba(2,6,23,.04); display:grid; grid-template-rows:auto auto 1fr auto; break-inside:avoid; }
  .pill { display:inline-block; font-size:9.5px; font-weight:700; letter-spacing:.35px; padding:2px 6px; border-radius:9999px; color:#1e293b; background:linear-gradient(90deg,#ecfeff,#eef2ff); border:1px solid #dbeafe; margin-bottom:3px; }
  .title { font-weight:700; font-size:13px; line-height:1.15; max-height:2.3em; overflow:hidden; }
  .sub { color:#64748b; font-size:10.5px; }
  .desc { font-size:11px; color:#334155; background:#f8fafc; border:1px solid #e2e8f0; border-radius:7px; padding:5px; margin:4px 0 6px; min-height:22px; }
  .stats { display:grid; grid-template-columns: repeat(3, 1fr); gap:4px; }
  .stat { border:1px solid #e2e8f0; border-radius:7px; padding:4px; background:#fafafa; }
  .lab { display:block; font-size:9px; color:#64748b; text-transform:uppercase; letter-spacing:.3px; }
  .val { font-weight:700; font-size:11.5px; }
  .pos { color:#047857; } .neg { color:#b91c1c; }
  .meta { margin-top:4px; font-size:9.5px; color:#64748b; }
  .signature { position:fixed; left:12mm; right:12mm; bottom:8mm; display:flex; align-items:center; justify-content:space-between; font-size:10px; color:#64748b; border-top:1px solid #e2e8f0; padding-top:6px; }
  .signature .right { display:flex; align-items:center; gap:8px; }
  .signature img { height:14px; }
</style></head>
<body>
  <div class="brand">
    <img src="${LOGO_URL}" alt="FullMargin" onerror="this.style.display='none'"/>
    <div><h1>Stratégies</h1><div class="muted">${escapeHtml(
      filterLabel
    )} — exporté le ${escapeHtml(today)}</div></div>
  </div>
  ${pagesHtml}
  <div class="signature">
    <span>© ${new Date().getFullYear()} FullMargin</span>
    <span class="right"><img src="${LOGO_URL}" alt="FullMargin" onerror="this.style.display='none'"/>Fait sur <b>www.fullmargin.net</b></span>
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
