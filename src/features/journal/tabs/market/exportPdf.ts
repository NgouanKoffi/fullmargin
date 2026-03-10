import type { MarketStats } from "./stats";
import { fmtMoney } from "../../utils";

export function exportMarketsPdf({
  markets,
  statsByMarket,
  currency,
  filterLabel,
}: {
  markets: Array<{ id: string; name: string; createdAt: string }>;
  statsByMarket: Map<string, MarketStats>;
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

  const chunk = <T>(arr: T[], size: number) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );

  const renderCard = (m: { id: string; name: string; createdAt: string }) => {
    const st =
      statsByMarket.get(m.id) ||
      ({
        trades: 0,
        wins: 0,
        breakeven: 0,
        invested: 0,
        gain: 0,
        loss: 0,
        net: 0,
        dd: 0,
        series: [],
      } as MarketStats);

    const winrate = st.trades
      ? ((st.wins / st.trades) * 100).toFixed(1)
      : "0.0";

    const fmt = (n: number) =>
      escapeHtml(`${fmtMoney(n, currency as never /* on s'en fiche ici */)}`);

    return `
      <article class="card">
        <div class="stripe"></div>
        <header class="card-hd">
          <div class="title" title="${escapeHtml(m.name)}">${escapeHtml(
      m.name
    )}</div>
          <div class="pill">MKT</div>
        </header>
        <div class="sub">${escapeHtml(
          new Date(m.createdAt).toLocaleString("fr-FR")
        )}</div>

        <div class="stats">
          <div class="stat"><span class="lab">Trades</span><span class="val">${
            st.trades
          }</span></div>
          <div class="stat"><span class="lab">Winrate</span><span class="val">${winrate}%</span></div>
          <div class="stat"><span class="lab">Gain</span><span class="val pos">${fmt(
            st.gain
          )}</span></div>
          <div class="stat"><span class="lab">Perte</span><span class="val neg">${fmt(
            -st.loss
          )}</span></div>
          <div class="stat"><span class="lab">PnL net</span><span class="val ${
            st.net < 0 ? "neg" : "pos"
          }">${fmt(st.net)}</span></div>
          <div class="stat"><span class="lab">Max DD</span><span class="val neg">${fmt(
            -st.dd
          )}</span></div>
          <div class="stat"><span class="lab">Investi</span><span class="val">${fmt(
            st.invested
          )}</span></div>
        </div>

        <div class="meta">ID : ${escapeHtml(m.id)}</div>
      </article>
    `;
  };

  const pagesHtml = chunk(markets, 4)
    .map(
      (group, i) => `
      <section class="page${
        i === Math.ceil(markets.length / 4) - 1 ? " last" : ""
      }">
        <div class="grid">
          ${group.map(renderCard).join("")}
        </div>
      </section>
    `
    )
    .join("");

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Marchés – PDF</title>
<style>
  @page { size: A4 landscape; margin: 14mm 12mm 24mm; }
  html,body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font: 11px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,"Helvetica Neue",Arial,"Noto Sans",sans-serif; color:#0f172a; }

  .brand { display:flex; align-items:center; gap:10px; margin:0 0 8px 0; }
  .brand img { height:18px; }
  h1 { font-size:16px; margin:0 0 2px 0; letter-spacing:-.2px; }
  .muted { color:#64748b; margin:0 0 8px 0; }

  .page { break-after: page; }
  .page.last { break-after: auto; }

  .grid { display:grid; grid-template-columns: 1fr 1fr; gap:6mm; grid-auto-rows:62mm; }

  .card {
    box-sizing:border-box;
    border:1px solid #dbe2ea;
    border-radius:12px;
    background:#fff;
    padding:8px 10px 10px;
    position:relative;
    overflow:hidden;
  }
  .stripe {
    position:absolute;
    left:0; top:0; right:0; height:3px;
    background:linear-gradient(135deg,#6366F1,#0EA5E9);
  }
  .card-hd { display:flex; align-items:center; justify-content:space-between; margin-top:5px; }
  .title { font-weight:700; font-size:12px; margin-right:8px; }
  .pill {
    font-size:10px; font-weight:700; padding:1px 6px; border-radius:999px;
    background:#eef2ff; color:#1e293b; border:1px solid #c7d2fe;
  }
  .sub { color:#64748b; font-size:10px; margin-top:2px; }

  .stats {
    display:grid; grid-template-columns: repeat(3, 1fr); gap:4px 8px; margin-top:6px;
  }
  .stat { border:1px solid #e2e8f0; border-radius:8px; padding:5px; background:#fafafa; }
  .lab { display:block; font-size:9.5px; color:#64748b; text-transform:uppercase; letter-spacing:.3px; }
  .val { font-weight:700; font-size:12px; }
  .pos { color:#047857; }
  .neg { color:#b91c1c; }

  .meta { margin-top:6px; font-size:10px; color:#64748b; }

  .signature {
    position:fixed; left:12mm; right:12mm; bottom:8mm;
    display:flex; align-items:center; justify-content:space-between;
    font-size:10px; color:#64748b; border-top:1px solid #e2e8f0; padding-top:4px;
  }
  .signature .right { display:flex; align-items:center; gap:8px; }
  .signature img { height:14px; }
</style></head>
<body>
  <div class="brand">
    <img src="${LOGO_URL}" alt="FullMargin" onerror="this.style.display='none'"/>
    <div>
      <h1>Marchés</h1>
      <div class="muted">${escapeHtml(filterLabel)} — exporté le ${escapeHtml(
    today
  )}</div>
    </div>
  </div>

  ${
    pagesHtml ||
    `<section class="page"><div class="muted">Aucun marché</div></section>`
  }

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
