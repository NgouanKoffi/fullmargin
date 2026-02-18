// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\public\modules\SearchBar.tsx
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

type Props = {
  placeholder?: string;
  defaultValue?: string;
  /** Appelé à chaque frappe/effacement (desktop seulement) */
  onChange?: (query: string) => void;
  /** Appelé si l’utilisateur valide (Entrée / bouton) */
  onSubmit?: (query: string) => void;
};

export default function SearchBar({
  placeholder = "Rechercher…",
  onSubmit,
  onChange,
  defaultValue = "",
}: Props) {
  const [q, setQ] = useState<string>(defaultValue);
  const [isTouch, setIsTouch] = useState(false);

  // garde l'input synchronisé si defaultValue change (ex: navigation)
  useEffect(() => {
    setQ(defaultValue);
  }, [defaultValue]);

  // détecte si on est sur un device tactile (mobile / tablette)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const touch =
      "ontouchstart" in window ||
      (navigator as any).maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0;

    setIsTouch(!!touch);
  }, []);

  // 🔥 Recherche "live" uniquement sur desktop (non tactile) + petit debounce
  useEffect(() => {
    if (!onChange) return;
    if (isTouch) return; // sur mobile : pas de recherche live pour éviter la fermeture du clavier

    const handle = window.setTimeout(() => {
      onChange(q);
    }, 250); // léger délai pour éviter de spam l'URL

    return () => window.clearTimeout(handle);
  }, [q, onChange, isTouch]);

  return (
    <form
      className="relative block"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(q.trim());
      }}
      role="search"
      aria-label="Recherche Marketplace"
    >
      <span className="absolute inset-y-0 left-0 flex items-center pl-3">
        <Search className="w-5 h-5 opacity-70" />
      </span>
      <input
        value={q}
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          // ❌ on NE déclenche plus onChange ici directement
          // → sur mobile, l'URL ne bouge pas tant que l'utilisateur n'a pas validé
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-neutral-900/60 px-11 py-3 text-sm outline-none focus:ring-2 focus:ring-violet-500/60"
        aria-label="Rechercher"
      />
    </form>
  );
}
