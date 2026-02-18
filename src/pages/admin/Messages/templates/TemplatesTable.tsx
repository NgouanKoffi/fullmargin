// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\admin\Messages\templates\TemplatesTable.tsx
import { Pencil, Inbox } from "lucide-react";
import type { EmailTemplate } from "../../../../data/defaultEmailTemplates";

type Props = {
  items: (EmailTemplate & { dbId?: string })[];
  onEdit: (id: string) => void;
};

export default function TemplatesTable({ items, onEdit }: Props) {
  return (
    <div className="rounded-2xl ring-1 ring-skin-border/20 bg-skin-surface overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-skin-border/15">
        <div>
          <h3 className="text-sm font-semibold">Modèles d’e-mail</h3>
          <p className="text-xs text-skin-muted">
            Intitulé, description & action d’édition (stockés en DB si
            sauvegardés)
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-skin-muted">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-skin-tile mb-2">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="text-sm">Aucun modèle pour le moment.</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left bg-skin-tile/50">
              <tr className="text-skin-muted">
                <th className="px-4 py-3 font-medium">Intitulé</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-skin-border/10">
              {items.map((t) => (
                <tr key={t.id} className="hover:bg-skin-tile/50">
                  <td className="px-4 py-3 align-top">
                    <div className="font-medium">{t.name || "Sans nom"}</div>

                    <div className="text-xs text-skin-muted">
                      Slug : <span className="font-mono">{t.id}</span>
                      {t.dbId ? (
                        <span className="ml-2 opacity-80">(DB)</span>
                      ) : (
                        <span className="ml-2 opacity-80">(default)</span>
                      )}
                    </div>

                    {t.subject ? (
                      <div className="text-xs text-skin-muted">
                        Sujet : {t.subject}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="text-skin-base/90">
                      {t.description || "—"}
                    </div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      title="Éditer"
                      aria-label={`Éditer ${t.name}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl ring-1 ring-skin-border/20 hover:bg-skin-tile"
                      onClick={() => onEdit(t.id)}
                    >
                      <Pencil className="w-4 h-4" />
                      Éditer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
