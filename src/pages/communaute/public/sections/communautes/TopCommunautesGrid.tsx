// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\sections\communautes\TopCommunautesGrid.tsx
import { useNavigate } from "react-router-dom";
import type { CommunityCardData } from "../../components/cards";

type Props = {
  items: CommunityCardData[];
};

export function TopCommunautesGrid({ items }: Props) {
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
        Aucune communauté à afficher pour le moment.
      </div>
    );
  }

  return (
    <div
      className="mt-4 grid gap-6 
      grid-cols-2 
      sm:grid-cols-3 
      md:grid-cols-4 
      lg:grid-cols-5 
      xl:grid-cols-6"
    >
      {items.map((c) => {
        const href: string =
          c.href ?? `/communaute/${encodeURIComponent(String(c.id))}`;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => navigate(href)}
            className="group flex flex-col items-center rounded-2xl 
              border border-slate-200 dark:border-slate-700
              bg-white/80 dark:bg-slate-900/70
              p-4 text-center shadow-sm transition 
              hover:-translate-y-1 hover:border-violet-400 hover:shadow-md"
          >
            <div className="relative mb-3 h-16 w-16 overflow-hidden rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100">
              <img
                src={c.logoSrc}
                alt={c.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
              {c.name}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {c.rating > 0 ? `${c.rating.toFixed(1)}★ · ` : ""}
              {c.followers ?? 0} abonnés
            </div>
          </button>
        );
      })}
    </div>
  );
}
