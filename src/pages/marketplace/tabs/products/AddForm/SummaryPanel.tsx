// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\AddForm\SummaryPanel.tsx
import type { ProductType } from "../types";
import { Card, CardHeader, Row } from "./ui";
import { Timer, ShieldCheck, CheckCircle2 } from "lucide-react";

type MaybeProductType = ProductType | "";

export default function SummaryPanel({
  type,
  needsVerification,
  canBadge, // candidat (selon type)
  badgeGranted, // badge réellement attribué
  delay,
}: {
  type: MaybeProductType;
  needsVerification: boolean;
  canBadge: boolean;
  badgeGranted: boolean;
  delay: "admin" | "immediate";
}) {
  const badgeValue = badgeGranted
    ? "Attribué"
    : canBadge
    ? "Après contrôle admin"
    : "Non éligible";

  return (
    <Card>
      <CardHeader title="Résumé" />
      <div className="mt-3 text-sm space-y-2">
        <Row label="Type" value={labelOfType(type)} />
        <Row
          label="Publication"
          value={delay === "admin" ? "Après validation admin" : "Immédiate"}
          icon={<Timer className="w-4 h-4 opacity-70" />}
        />
        <Row
          label="Vérification"
          value={needsVerification ? "Requise" : "Non requise"}
          icon={<ShieldCheck className="w-4 h-4 opacity-70" />}
        />
        <Row
          label="Badge de sûreté"
          value={badgeValue}
          icon={<CheckCircle2 className="w-4 h-4 opacity-70" />}
        />
      </div>
    </Card>
  );
}

function labelOfType(t: MaybeProductType) {
  if (!t) return "—";
  const map: Record<ProductType, string> = {
    robot_trading: "Robot de trading",
    indicator: "Indicateur",
    ebook_pdf: "E-book / PDF / Livre",
    template_excel: "Template / Outil Excel",
  };
  return map[t];
}
