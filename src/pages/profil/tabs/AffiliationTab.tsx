import { useEffect, useState } from "react";
import { notifyError, notifySuccess } from "../../../components/Notification";
import type { AffiliationMe, AffiliationCommission } from "../types";
import { getAuthToken } from "../../../lib/api";
import {
  HiClipboardDocument,
  HiClipboardDocumentCheck,
  HiSparkles,
  HiUsers,
} from "react-icons/hi2";
import {
  apiGenerateAffiliation,
  apiGetAffiliationMe,
} from "../../../lib/affiliationApi";

function hasMessage(x: unknown): x is { message: string } {
  return typeof (x as { message?: unknown }).message === "string";
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (hasMessage(err)) return err.message;
  return "Une erreur est survenue.";
}

// petit helper pour passer des cents → dollars
function formatMoneyCents(
  cents: number | undefined,
  currency: string = "USD"
): string {
  const v = typeof cents === "number" ? cents / 100 : 0;
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(v);
}

export default function AffiliationTab() {
  const [data, setData] = useState<AffiliationMe | null>(null);
  const [copyOk, setCopyOk] = useState(false);
  const [loading, setLoading] = useState(true);
  const [genLoading, setGenLoading] = useState(false);

  const token = getAuthToken();

  const reload = async () => {
    try {
      setLoading(true);
      const r = await apiGetAffiliationMe(token || undefined);
      setData(r.data);
    } catch (e: unknown) {
      notifyError(getErrorMessage(e) || "Erreur lors du chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCopy = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopyOk(true);
      notifySuccess("Lien copié !");
      setTimeout(() => setCopyOk(false), 2000);
    } catch {
      notifyError("Échec de la copie du lien.");
    }
  };

  const onGenerate = async () => {
    try {
      setGenLoading(true);
      const r = await apiGenerateAffiliation(token || undefined);
      setData(r.data);
      notifySuccess("Lien d’affiliation généré.");
    } catch (e: unknown) {
      notifyError(getErrorMessage(e) || "Génération impossible.");
    } finally {
      setGenLoading(false);
    }
  };

  // ====== calculs commissions ======
  const commissions = data?.commissions || [];

  const firstMonthComms = commissions.filter(
    (c) => c.monthIndex === 1
  ) as AffiliationCommission[];
  const secondMonthComms = commissions.filter(
    (c) => c.monthIndex === 2
  ) as AffiliationCommission[];

  // on part du principe que tu es en USD tant que ton Stripe est en USD
  const totalUsdCents = data?.totals?.usd ?? 0;

  const firstMonthTotal = firstMonthComms.reduce(
    (sum, c) => sum + (c.amount || 0),
    0
  );
  const secondMonthTotal = secondMonthComms.reduce(
    (sum, c) => sum + (c.amount || 0),
    0
  );

  return (
    <div className="rounded-2xl border border-skin-border/60 ring-1 ring-skin-border/30 bg-white dark:bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-skin-base font-semibold inline-flex items-center gap-2">
          <HiUsers className="w-5 h-5" /> Affiliation
        </h3>
        <span className="text-xs px-2 py-1 rounded-md bg-fm-primary/10 text-fm-primary font-semibold">
          BETA
        </span>
      </div>

      {/* Bloc lien */}
      <div className="mt-4">
        {loading ? (
          <div className="h-10 rounded-xl bg-skin-tile animate-pulse" />
        ) : data?.code && data?.link ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              readOnly
              value={data.link}
              className="flex-1 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm ring-1 ring-skin-border/30"
            />
            <button
              onClick={onCopy}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ring-1 ring-skin-border/30 hover:bg-skin-tile"
              title="Copier le lien"
            >
              {copyOk ? (
                <HiClipboardDocumentCheck className="w-5 h-5" />
              ) : (
                <HiClipboardDocument className="w-5 h-5" />
              )}
              {copyOk ? "Copié" : "Copier"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-900/10 px-3 py-3">
            <div className="text-amber-700 dark:text-amber-200 text-sm">
              Aucun lien généré pour l’instant. Créez votre lien d’affiliation
              et commencez à parrainer.
            </div>
            <button
              onClick={onGenerate}
              disabled={genLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-fm-primary text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
            >
              <HiSparkles className="w-5 h-5" />
              {genLoading ? "Génération…" : "Générer"}
            </button>
          </div>
        )}
      </div>

      {/* ======= Bloc commissions FM Metrix ======= */}
      {!loading && (
        <div className="mt-6 space-y-3">
          {/* total global */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-300/80 uppercase tracking-wide">
                Solde total FM Metrix
              </p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatMoneyCents(totalUsdCents, "USD")}
              </p>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-400">
              Basé sur 2 premiers paiements de tes filleuls
            </div>
          </div>

          {/* deux petites tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Premier abonnement */}
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 p-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Premier abonnement (15%)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">
                {firstMonthComms.length} paiement(s)
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatMoneyCents(firstMonthTotal, "USD")}
              </p>
            </div>

            {/* Deuxième abonnement */}
            <div className="rounded-xl border border-slate-200/70 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 p-3">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Les autres abonnements (9%)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-300 mb-3">
                {secondMonthComms.length} paiement(s)
              </p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {formatMoneyCents(secondMonthTotal, "USD")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Liste des affiliés */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-skin-muted">
            Vos affiliés
          </h4>
          {!loading && (
            <span className="text-xs text-skin-muted">
              {data?.count ?? 0} inscrit(s)
            </span>
          )}
        </div>

        {loading ? (
          <div className="mt-3 space-y-2">
            <div className="h-14 rounded-xl bg-skin-tile animate-pulse" />
            <div className="h-14 rounded-xl bg-skin-tile animate-pulse" />
            <div className="h-14 rounded-xl bg-skin-tile animate-pulse" />
          </div>
        ) : (data?.affiliates?.length ?? 0) > 0 ? (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data!.affiliates.map((a) => (
              <div
                key={a.id}
                className="rounded-xl ring-1 ring-skin-border/25 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900/70 p-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      a.avatarUrl ||
                      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
                        a.fullName || a.email
                      )}`
                    }
                    alt={a.fullName || a.email}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-slate-900"
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-skin-base truncate">
                      {a.fullName || "—"}
                    </div>
                    <div className="text-xs text-skin-muted truncate">
                      {a.email}
                    </div>
                    {a.joinedAt && (
                      <div className="text-[11px] text-skin-muted/70">
                        Inscrit le{" "}
                        {new Date(a.joinedAt).toLocaleDateString("fr-FR")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-skin-muted">
            Aucun affilié pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}
