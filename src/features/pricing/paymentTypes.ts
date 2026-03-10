// src/pages/pricing/paymentTypes.ts

export type CheckoutSuccessPayload = {
  url: string;
};

export type CheckoutResponseV1 = {
  ok: boolean;
  data: CheckoutSuccessPayload;
  error?: string;
  message?: string;
};

export type CheckoutResponseV0 = {
  ok: boolean;
  url: string;
  error?: string;
  message?: string;
};

export type FedapayResponse = {
  ok?: boolean;
  checkoutUrl?: string;
  url?: string;
  error?: string;
  message?: string;
  details?: unknown;
};

// 👉 ce que peut contenir ta session
export type PricingSessionUser = {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type PricingSession = {
  token?: string;
  user?: PricingSessionUser;
  email?: string;
};

export function isCheckoutResponseV1(
  data: unknown
): data is CheckoutResponseV1 {
  return (
    typeof data === "object" &&
    data !== null &&
    "ok" in data &&
    (data as { ok: unknown }).ok === true &&
    "data" in data &&
    typeof (data as { data: unknown }).data === "object" &&
    (data as { data: { url?: unknown } }).data !== null &&
    typeof (data as { data: { url?: unknown } }).data.url === "string"
  );
}

export function isCheckoutResponseV0(
  data: unknown
): data is CheckoutResponseV0 {
  return (
    typeof data === "object" &&
    data !== null &&
    "ok" in data &&
    (data as { ok?: unknown }).ok === true &&
    "url" in data &&
    typeof (data as { url?: unknown }).url === "string"
  );
}

export function isFedapayResponse(data: unknown): data is FedapayResponse {
  return typeof data === "object" && data !== null;
}
