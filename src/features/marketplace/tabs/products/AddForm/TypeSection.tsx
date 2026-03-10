// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\AddForm\TypeSection.tsx
import { productTypeOptions } from "../rules";
import type { ProductType } from "../types";
import InfoChips from "./_shared/InfoChips";
import { Card, CardHeader, Select, Label } from "./ui";

type MaybeProductType = ProductType | "";

export default function TypeSection({
  type,
  onChangeType,
  needsVerification,
  canBadge,
  badgeGranted,
  delay,
}: {
  type: MaybeProductType;
  onChangeType: (t: MaybeProductType) => void;
  needsVerification: boolean;
  canBadge: boolean; // 👈 “candidat” selon le type
  badgeGranted: boolean; // 👈 vrai badge déjà attribué par le back (édition)
  delay: "admin" | "immediate";
}) {
  return (
    <Card>
      <CardHeader
        title="Type de produit"
        subtitle="Le type détermine les règles de publication et l’accès potentiel au badge de sûreté."
      />
      <div className="mt-4 space-y-4">
        <div>
          <Label>Type</Label>
          <Select
            value={type ?? ""}
            onChange={(v) => onChangeType((v as ProductType) || "")}
            options={[
              { value: "", label: "Choisir un type de produit…" },
              ...productTypeOptions.map((o) => ({
                value: o.value,
                label: o.label,
              })),
            ]}
          />
        </div>

        {type && (
          <InfoChips
            needsVerification={needsVerification}
            canBadge={canBadge}
            badgeGranted={badgeGranted}
            delay={delay}
          />
        )}
      </div>
    </Card>
  );
}
