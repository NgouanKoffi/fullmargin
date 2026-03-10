// src/pages/communaute/public/community-details/tabs/about/fields/BasicInfoFields.tsx
export default function BasicInfoFields({
  name,
  slug,
  onNameChange,
  onSlugChange,
  slugChecking,
  slugOk,
}: {
  name: string;
  slug: string;
  onNameChange: (v: string) => void;
  onSlugChange: (v: string) => void;
  slugChecking: boolean;
  slugOk: boolean | null;
}) {
  return (
    <>
      <div className="lg:col-span-2">
        <label className="text-sm font-medium text-slate-900 dark:text-slate-200">
          Nom de la communauté
        </label>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Ex: FULLMARGIN TRADERS"
          className="mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900/40 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300/20 text-slate-900 dark:text-slate-100"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-900 dark:text-slate-200">
          Identifiant (slug URL)
        </label>
        <div className="mt-1 relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            /communaute/
          </span>
          <input
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            placeholder="fullmargin-traders"
            className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-slate-900/40 pl-28 pr-3 py-2 text-sm outline-none text-slate-900 dark:text-slate-100"
          />
        </div>
        {slugChecking ? (
          <div className="mt-1 text-xs opacity-70">Vérification du slug…</div>
        ) : slugOk === false ? (
          <div className="mt-1 text-xs text-red-600 dark:text-red-400">
            Ce slug est déjà pris.
          </div>
        ) : slugOk === true ? (
          <div className="mt-1 text-xs text-emerald-600 dark:text-emerald-300">
            Slug disponible.
          </div>
        ) : null}
      </div>
    </>
  );
}
