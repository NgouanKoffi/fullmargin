// src/pages/journal/tabs/journal/JournalForm/useJournalFormState.ts
import { useEffect, useState } from "react";
import type { JournalEntry } from "../../../types";
import { isZeroish, fmt2, filterDecimal, uuid, fileToDataUrl } from "./helpers";

export type JournalEntryExt = JournalEntry & { images?: string[] };

type Params = {
  initial?: Partial<JournalEntryExt>;
};

// Autorise chiffres, virgule, point, signe - et limite les décimales
const normalizeDecimalInput = (
  raw: string,
  decimals: number,
  allowNegative: boolean
): string => {
  // On garde seulement chiffres, , . et -
  let v = raw.replace(/[^\d,.-]/g, "");

  // Gestion du signe -
  if (allowNegative) {
    const isNeg = v.startsWith("-");
    v = v.replace(/-/g, "");
    if (isNeg) v = "-" + v;
  } else {
    v = v.replace(/-/g, "");
  }

  const hasComma = v.includes(",");
  const hasDot = v.includes(".");
  let sep: "," | "." | null = null;

  if (hasComma && hasDot) {
    // On garde le dernier séparateur tapé comme vrai séparateur
    const lastComma = v.lastIndexOf(",");
    const lastDot = v.lastIndexOf(".");
    sep = lastComma > lastDot ? "," : ".";
    if (sep === ",") {
      v = v.replace(/\./g, "");
    } else {
      v = v.replace(/,/g, "");
    }
  } else if (hasComma) {
    sep = ",";
  } else if (hasDot) {
    sep = ".";
  }

  if (sep) {
    const isNeg = v.startsWith("-");
    const body = isNeg ? v.slice(1) : v;
    const parts = body.split(sep);
    const intPart = parts[0];
    const decPart = parts.slice(1).join("");
    const trimmedDec = decPart.slice(0, decimals);
    v = (isNeg ? "-" : "") + intPart + (trimmedDec ? sep + trimmedDec : sep); // on garde le sep si l'user vient de le taper
  }

  return v;
};

export function useJournalFormState({ initial }: Params) {
  const nowIso = new Date().toISOString();

  const [state, setState] = useState<JournalEntryExt>(() => {
    const imagesInit: string[] = (
      initial?.images && initial.images.length > 0
        ? initial.images
        : initial?.imageDataUrl || initial?.imageUrl
        ? [initial.imageDataUrl || (initial.imageUrl as string)]
        : []
    ) as string[];

    return {
      id: (initial?.id as string) || uuid(),
      accountId: initial?.accountId || "",
      accountName: initial?.accountName || "",
      marketId: initial?.marketId || "",
      marketName: initial?.marketName || "",
      strategyId: initial?.strategyId || "",
      strategyName: initial?.strategyName || "",

      order: (initial?.order ?? "") as JournalEntry["order"],
      lot: initial?.lot || "",
      result: (initial?.result ?? "") as JournalEntry["result"],
      detail: initial?.detail || "",
      invested: initial?.invested || "",
      resultMoney: initial?.resultMoney || "",
      resultPct: initial?.resultPct || "",
      respect: (initial?.respect ?? "") as JournalEntry["respect"],
      duration: initial?.duration || "",
      timeframes: initial?.timeframes || [],
      session: (initial?.session ?? "") as JournalEntry["session"],

      comment: initial?.comment || "",
      imageDataUrl:
        initial?.imageDataUrl ||
        (imagesInit.length > 0 ? imagesInit[0] : "") ||
        (initial?.imageUrl as string) ||
        "",
      images: imagesInit.slice(0, 5),

      date: initial?.date || nowIso.slice(0, 10),
      createdAt: (initial?.createdAt as string) || nowIso,
    };
  });

  const [moneyMsg, setMoneyMsg] = useState("");

  const setField = <K extends keyof JournalEntryExt>(
    k: K,
    v: JournalEntryExt[K]
  ) => setState((s) => ({ ...s, [k]: v }));

  const isLoss = state.result === "Perte";
  const isGain = state.result === "Gain";
  const isNull = state.result === "Nul";

  // recalcul du %
  useEffect(() => {
    const inv = Number(String(state.invested).replace(",", "."));
    const res = Number(String(state.resultMoney).replace(",", "."));
    if (Number.isFinite(inv) && inv !== 0 && Number.isFinite(res)) {
      setField("resultPct", fmt2((res / inv) * 100));
    } else if (
      (Number.isFinite(inv) && inv !== 0 && !Number.isFinite(res)) ||
      isNull
    ) {
      setField("resultPct", "0.00");
    } else {
      setField("resultPct", "");
    }
  }, [state.invested, state.resultMoney, isNull]);

  const handleResultMoneyChange = (raw: string) => {
    if (isNull) {
      setField("resultMoney", "0");
      setMoneyMsg("Nul sélectionné : le montant est fixé à 0.");
      return;
    }

    if (isLoss) {
      // on autorise négatif
      const v = normalizeDecimalInput(raw, 2, true);
      const abs = v.replace(/^-/, "");

      if (!abs) {
        setField("resultMoney", "");
        setMoneyMsg(
          "Perte : entrez un montant (il sera négatif automatiquement)."
        );
        return;
      }

      const absDot = abs.replace(",", ".");
      if (isZeroish(absDot)) {
        setField("resultMoney", "0");
        setMoneyMsg("Perte : montant zéro accepté (0).");
      } else {
        const withoutSign = abs;
        setField("resultMoney", `-${withoutSign}`);
        setMoneyMsg("Perte sélectionnée : le montant est forcé en négatif.");
      }
      return;
    }

    // GAIN : jamais de signe -
    const hadMinus = /-/.test(raw);
    const v = normalizeDecimalInput(raw, 2, false);

    setField("resultMoney", v);
    setMoneyMsg(
      hadMinus ? "Gain : le signe « - » est interdit, il a été retiré." : ""
    );
  };

  // images
  const MAX_IMAGES = 5;
  async function addImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remain = Math.max(0, MAX_IMAGES - (state.images?.length || 0));
    const toLoad = Array.from(files).slice(0, remain);
    const urls: string[] = [];
    for (const f of toLoad) {
      try {
        const url = await fileToDataUrl(f);
        urls.push(url);
      } catch (err) {
        console.error("fileToDataUrl error:", err);
      }
    }
    const next = [...(state.images || []), ...urls].slice(0, MAX_IMAGES);
    setField("images", next);
    setField("imageDataUrl", next[0] || "");
  }

  function removeImage(idx: number) {
    const next = (state.images || []).filter((_, i) => i !== idx);
    setField("images", next);
    setField("imageDataUrl", next[0] || "");
  }

  const setLot = (raw: string) => setField("lot", filterDecimal(raw, 4));

  // ✅ on relâche la validation : on laisse enregistrer dès qu'il y a une date
  const isValid = !!state.date;

  return {
    state,
    setField,
    handleResultMoneyChange,
    moneyMsg,
    isLoss,
    isGain,
    isNull,
    addImages,
    removeImage,
    setLot,
    isValid,
  };
}
