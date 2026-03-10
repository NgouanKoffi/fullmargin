// src/pages/journal/tabs/view/filters.ts
export type Filters = {
  accountId: string;
  marketId: string;
  strategyId: string;
  order: "" | "Buy" | "Sell";
  result: "" | "Gain" | "Perte" | "Nul";
  respect: "" | "Oui" | "Non";
  session: "" | "london" | "newyork" | "asiatique";
  from: string;
  to: string;
};

export const EMPTY_FILTERS: Filters = {
  accountId: "",
  marketId: "",
  strategyId: "",
  order: "",
  result: "",
  respect: "",
  session: "",
  from: "",
  to: "",
};
