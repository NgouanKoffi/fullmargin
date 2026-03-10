// src/pages/marketplace/CheckoutGatePage.tsx
import { createElement } from "react";
import { Navigate } from "react-router-dom";

import CheckoutPage from "@features/marketplace/CheckoutPage";
import { hasCheckoutGate, hasCheckoutIntent } from "./checkoutGate";
import { useCartItems } from "@features/marketplace/lib/cart";

export default function CheckoutGatePage() {
  const items = useCartItems();
  const hasQty = items.some((i) => (Number(i.qty) || 0) > 0);

  if (!hasCheckoutGate()) {
    return createElement(Navigate, {
      to: "/marketplace/dashboard?tab=cart",
      replace: true,
    });
  }

  if (!hasQty && !hasCheckoutIntent()) {
    return createElement(Navigate, {
      to: "/marketplace/dashboard?tab=cart",
      replace: true,
    });
  }

  return createElement(CheckoutPage);
}
