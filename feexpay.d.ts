// src/feexpay.d.ts
declare module "@feexpay/react-sdk" {
  import React from "react";

  // Interface pour la réponse du callback
  export interface FeexPayResponse {
    status: string;
    reference?: string;
    id?: string;
    [key: string]: unknown;
  }

  // Interface COMPLÈTE avec 'email', 'firstname', etc.
  export interface FeexPayButtonProps {
    token: string;
    id: string;
    amount: number;
    currency?: string;

    // ✅ Ces champs manquaient dans la définition par défaut
    email?: string;
    firstname?: string;
    lastname?: string;
    description?: string;

    callback?: (response: FeexPayResponse) => void;
    callback_url?: string;
    custom_data?: string;
    disabled?: boolean;
    className?: string;
    style?: React.CSSProperties;
    buttonText?: string;
  }

  export const FeexPayButton: React.FC<FeexPayButtonProps>;
}
