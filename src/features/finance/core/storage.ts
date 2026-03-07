// src/pages/finance/core/storage.ts
import { ym, type Account, type Transaction, type Currency } from "./types";
import * as financeApi from "./api";

/* =================================================================
   0) Petit cache mémoire (PAS de localStorage)
   ================================================================= */
const MEMORY = {
  globalCurrency: "" as Currency | "",
  accounts: [] as Account[],
  transactions: [] as Transaction[],
};

/* =================================================================
   1) Devise globale
   - maintenant on essaie d’abord de la lire dans /finance/prefs
   - sinon on retombe sur la devise du 1er compte
   - sinon XOF
   ================================================================= */
export async function loadGlobalCurrency(): Promise<Currency> {
  // déjà en mémoire pour cette session
  if (MEMORY.globalCurrency) return MEMORY.globalCurrency as Currency;

  // 1) on tente les prefs backend
  try {
    const prefs = await financeApi.getPrefs();
    if (prefs.globalCurrency) {
      MEMORY.globalCurrency = prefs.globalCurrency;
      return prefs.globalCurrency;
    }
  } catch {
    // on ignore, on passe à la suite
  }

  // 2) essayer de déduire du 1er compte
  try {
    const { items } = await financeApi.listAccounts({ limit: 1 });
    if (items.length > 0) {
      MEMORY.globalCurrency = items[0].currency;
      return items[0].currency;
    }
  } catch {
    // ignore
  }

  MEMORY.globalCurrency = "XOF";
  return "XOF";
}

/** Sauvegarde la devise globale côté backend + cache */
export async function saveGlobalCurrency(cur: Currency) {
  MEMORY.globalCurrency = cur;
  try {
    await financeApi.updatePrefs({ globalCurrency: cur });
  } catch (e) {
    // on ne casse pas l'UI si l'API est off
    console.warn("saveGlobalCurrency failed", e);
  }
}

/* =================================================================
   2) Fonctions de “lecture” synchrones (compat)
   ================================================================= */
export function loadAccounts(): Account[] {
  return MEMORY.accounts.slice();
}

export function loadTransactions(): Transaction[] {
  return MEMORY.transactions.slice();
}

/* =================================================================
   3) Matérialisation des occurrences mensuelles
   ================================================================= */
export function materializeMonthly(txs: Transaction[]): Transaction[] {
  const now = new Date();
  const endToday = new Date();
  endToday.setHours(23, 59, 59, 999);
  const out = txs
    .filter((t) => new Date(t.date).getTime() <= endToday.getTime())
    .map((t) => ({ ...t }));

  const seen = new Set(
    out
      .filter((t) => t.parentId)
      .map((t) => `${t.parentId}:${ym(new Date(t.date))}`)
  );

  for (const t of txs) {
    if (t.recurrence !== "mensuel" || t.parentId) continue;

    const start = new Date(t.date);
    if (start.getTime() > endToday.getTime()) continue;

    const months =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());

    for (let m = 1; m <= months; m++) {
      const occ = new Date(start);
      occ.setMonth(start.getMonth() + m);

      const key = `${t.id}:${ym(occ)}`;
      if (seen.has(key)) continue;

      const day = String(start.getDate()).padStart(2, "0");
      const iso = new Date(`${ym(occ)}-${day}T00:00:00Z`).toISOString();
      if (new Date(iso).getTime() > endToday.getTime()) continue;

      out.push({
        ...t,
        id:
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        parentId: t.id,
        date: iso,
        createdAt: new Date().toISOString(),
      });
      seen.add(key);
    }
  }
  return out;
}

/* =================================================================
   4) Wrappers asynchrones alignés BACKEND
   ================================================================= */

/** Charge depuis l’API et met à jour le cache mémoire. */
export async function fetchAccounts(): Promise<Account[]> {
  const { items } = await financeApi.listAccounts({ limit: 200 });
  MEMORY.accounts = items.map((a) => ({
    id: a.id,
    name: a.name,
    currency: a.currency,
    initial: Number(a.initial) || 0,
    description: a.description || "",
    createdAt: a.createdAt,
  }));
  // si pas encore de devise globale en mémoire on prend celle du 1er compte
  if (!MEMORY.globalCurrency && items[0]) {
    MEMORY.globalCurrency = items[0].currency;
  }
  return MEMORY.accounts.slice();
}

/** Création compte côté API + cache mémoire. */
export async function createAccount(data: {
  name: string;
  currency?: Account["currency"];
  initial?: number;
  description?: string;
}) {
  const cur = (MEMORY.globalCurrency as Currency) || "XOF";
  const res = await financeApi.createAccount({
    name: data.name,
    currency: cur,
    initial: data.initial,
    description: data.description,
  });

  const nowISO = new Date().toISOString();
  const newAccount: Account = {
    id: res.id,
    name: data.name,
    currency: cur,
    initial: Number(data.initial) || 0,
    description: (data.description || "").trim(),
    createdAt: nowISO,
  };

  MEMORY.accounts = [
    newAccount,
    ...MEMORY.accounts.filter((a) => a.id !== res.id),
  ];
  return res;
}

/** Mise à jour compte côté API + cache mémoire. */
export async function patchAccount(
  id: string,
  data: Partial<Pick<Account, "name" | "currency" | "initial" | "description">>
) {
  const res = await financeApi.updateAccount(id, data);
  MEMORY.accounts = MEMORY.accounts.map((a) =>
    a.id === id ? ({ ...a, ...data } as Account) : a
  );
  return res;
}

/** Suppression compte côté API + cache mémoire. */
export async function removeAccount(id: string) {
  const res = await financeApi.deleteAccount(id);
  MEMORY.accounts = MEMORY.accounts.filter((a) => a.id !== id);
  return res;
}

/** Charge les transactions depuis l’API (avec filtres) + cache mémoire. */
export async function fetchTransactions(
  params?: financeApi.ListTxParams
): Promise<Transaction[]> {
  const { items } = await financeApi.listTransactions(params);
  if (!params || Object.keys(params).length === 0) {
    MEMORY.transactions = items.map((t) => ({
      ...t,
      amount: Number(t.amount) || 0,
    }));
  }
  return items.map((t) => ({ ...t, amount: Number(t.amount) || 0 }));
}

/** Création transaction + cache mémoire */
export async function createTransaction(payload: {
  accountId: string;
  type: Transaction["type"];
  amount: number;
  date: string;
  recurrence: Transaction["recurrence"];
  detail: Transaction["detail"];
  comment?: string;
  parentId?: string;
}) {
  const res = await financeApi.createTransaction(payload);
  const created: Transaction = {
    id: res.id,
    createdAt: new Date().toISOString(),
    ...payload,
  };
  MEMORY.transactions = [created, ...MEMORY.transactions];
  return res;
}

export async function patchTransaction(
  id: string,
  data: Partial<
    Pick<
      Transaction,
      | "accountId"
      | "type"
      | "amount"
      | "date"
      | "recurrence"
      | "detail"
      | "comment"
    >
  >
) {
  const res = await financeApi.updateTransaction(id, data);
  MEMORY.transactions = MEMORY.transactions.map((t) =>
    t.id === id ? ({ ...t, ...data } as Transaction) : t
  );
  return res;
}

export async function removeTransaction(id: string) {
  const res = await financeApi.deleteTransaction(id);
  MEMORY.transactions = MEMORY.transactions.filter((t) => t.id !== id);
  return res;
}
