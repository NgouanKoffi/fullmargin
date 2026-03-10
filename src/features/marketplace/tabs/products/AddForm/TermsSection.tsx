// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\AddForm\TermsSection.tsx
import { Card, CardHeader, ErrorLine } from "./ui";

export default function TermsSection({
  checked,
  onChange,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
}) {
  return (
    <Card>
      <CardHeader title="Conditions d’utilisation" />
      <div className="mt-3 space-y-2">
        <div className="flex items-start gap-2">
          <input
            id="terms"
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="mt-1"
          />
          <label htmlFor="terms" className="text-sm">
            Je certifie que ce produit m’appartient et respecte la{" "}
            <a
              href="https://fullmargin.net/charte-vendeur"
              target="_blank"
              rel="noreferrer"
              className="text-violet-600 hover:underline dark:text-violet-400"
            >
              charte Vendeur de FullMargin
            </a>
            .
          </label>
        </div>
        <ErrorLine text={error} className="-mt-1" />
      </div>
    </Card>
  );
}
