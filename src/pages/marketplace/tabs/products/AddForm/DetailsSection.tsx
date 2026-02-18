// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\AddForm\DetailsSection.tsx
import { Card, CardHeader, Label, Input, ErrorLine } from "./ui";
import { RichTextDescriptionEditor } from "../../../../../components/blocknote/RichTextDescription";

export default function DetailsSection({
  title,
  shortDescription,
  longDescription,
  onChangeTitle,
  onChangeShort,
  onChangeLong,
  errors,
  /** Optionnel : si tu veux afficher un champ Catégorie en lecture seule, mets true */
  showCategory = false,
}: {
  title: string;
  shortDescription: string;
  longDescription: string;
  onChangeTitle: (v: string) => void;
  onChangeShort: (v: string) => void;
  onChangeLong: (v: string) => void;
  errors?: Record<string, string | undefined>;
  showCategory?: boolean;
}) {
  return (
    <Card>
      <CardHeader title="Détails du produit" subtitle="Titre et descriptions" />

      <div className="mt-4 space-y-4">
        {/* Titre */}
        <div>
          <Label required>Titre</Label>
          <Input
            value={title}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="Ex: Robot Scalper X"
          />
          <ErrorLine text={errors?.title} />
        </div>

        {/* Champ Catégorie supprimé (géré par le sélecteur principal) */}
        {showCategory && (
          <div>
            <Label>Catégorie</Label>
            <Input
              disabled
              placeholder="La catégorie est réglée via le sélecteur au-dessus"
            />
          </div>
        )}

        {/* Description courte */}
        <div>
          <Label required>Description courte</Label>
          <RichTextDescriptionEditor
            value={shortDescription}
            onChange={onChangeShort}
          />
          <ErrorLine text={errors?.shortDescription} />
        </div>

        {/* Description longue */}
        <div>
          <Label required>Description longue</Label>
          <RichTextDescriptionEditor
            value={longDescription}
            onChange={onChangeLong}
          />
          <ErrorLine text={errors?.longDescription} />
        </div>
      </div>
    </Card>
  );
}
