// src/auth/api/password.ts
import { api } from "../../lib/api";

export type RequestResp = {
  ok: boolean;
  resetId?: string;
  masked?: string;
  expiresInSec?: number;
  error?: string;
};

export function requestReset(email: string) {
  return api.post<RequestResp>(
    "/auth/password/request",
    { email },
    { withAuth: false }
  );
}

export function resendReset(resetId: string) {
  return api.post<RequestResp>(
    "/auth/password/resend",
    { resetId },
    { withAuth: false }
  );
}

export function verifyReset(
  resetId: string,
  code: string,
  newPassword: string
) {
  return api.post<{ ok: boolean; done?: boolean; error?: string }>(
    "/auth/password/verify",
    { resetId, code, newPassword },
    { withAuth: false }
  );
}
