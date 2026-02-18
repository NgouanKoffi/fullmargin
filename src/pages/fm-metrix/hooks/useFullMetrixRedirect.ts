// src/pages/fm-metrix/hooks/useFullMetrixRedirect.ts
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../../lib/api";
import { loadSession } from "../../../auth/lib/storage";

export function useFullMetrixRedirect() {
  const navigate = useNavigate();
  const [redirectingFM, setRedirectingFM] = useState(false);

  const goToFM = useCallback(async () => {
    if (redirectingFM) return;

    const session = loadSession?.();
    const token = session?.token;

    if (!token) {
      navigate("/tarifs");
      return;
    }

    setRedirectingFM(true);

    try {
      const accessResp = await fetch(`${API_BASE}/payments/fm-metrix/access`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const accessData = await accessResp.json().catch(() => null);

      const isOk = accessResp.ok && accessData?.ok;
      const allowed = Boolean(accessData?.allowed);

      if (!isOk || !allowed) {
        setRedirectingFM(false);
        navigate("/tarifs");
        return;
      }

      const ssoResp = await fetch(`${API_BASE}/auth/sso/fullmetrix?mode=json`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ssoData = await ssoResp.json().catch(() => null);

      if (ssoResp.ok && ssoData?.ok && ssoData.redirectUrl) {
        window.location.href = ssoData.redirectUrl;
        return;
      }

      setRedirectingFM(false);
      navigate("/tarifs");
    } catch {
      setRedirectingFM(false);
      navigate("/tarifs");
    }
  }, [navigate, redirectingFM]);

  return { goToFM, isLoading: redirectingFM };
}
