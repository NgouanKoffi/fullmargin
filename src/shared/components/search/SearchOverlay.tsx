// src/components/Search/SearchOverlay.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Home, Info, Store, BadgeDollarSign, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* ---------- Petit index par défaut (remplace/complète à ta guise) ---------- */
type Item = { title: string; href: string; icon?: React.ReactNode; locked?: boolean; group?: string };

const DEFAULT_INDEX: Item[] = [
  { title: "Accueil", href: "/", icon: <Home className="w-4 h-4" /> },
  { title: "À propos", href: "/a-propos", icon: <Info className="w-4 h-4" /> },
  { title: "Tarifs", href: "/tarifs", icon: <BadgeDollarSign className="w-4 h-4" /> },
  { title: "Marketplace", href: "#market", icon: <Store className="w-4 h-4" />, group: "Commerce" },
  { title: "Boutiques", href: "#boutiques", icon: <Lock className="w-4 h-4" />, locked: true, group: "Commerce" },
  { title: "Communautés", href: "#communautes", icon: <Lock className="w-4 h-4" />, locked: true, group: "Réseau" },
  { title: "Confidentialité", href: "/confidentialite" },
  { title: "Conditions d’utilisation", href: "/conditions" },
];

/* ---------- Utils ---------- */
const norm = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function useKeydown(handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => handler(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler]);
}

/* ---------- Overlay ---------- */
export default function SearchOverlay() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [enter, setEnter] = useState(false); // pour l’anim (translate-x)
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Ouvre/ferme via bus global
  useEffect(() => {
    const openEv = () => {
      setOpen(true);
      setEnter(false);
      // Bloquer le scroll body
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => setEnter(true));
      // focus input après la peinture
      setTimeout(() => inputRef.current?.focus(), 20);
    };
    const closeEv = () => {
      setEnter(false);
      setTimeout(() => setOpen(false), 280);
      document.body.style.overflow = "";
      setQ("");
      setActive(0);
    };
    const onOpen = () => openEv();
    const onClose = () => closeEv();
    window.addEventListener("fm:open-search", onOpen as EventListener);
    window.addEventListener("fm:close-search", onClose as EventListener);
    return () => {
      window.removeEventListener("fm:open-search", onOpen as EventListener);
      window.removeEventListener("fm:close-search", onClose as EventListener);
      document.body.style.overflow = "";
    };
  }, []);

  // Raccourcis clavier globaux: Ctrl/⌘K ou "/" pour ouvrir; ESC pour fermer
  useKeydown((e) => {
    // Ne pas interférer quand on tape déjà dans un input/textarea
    const tag = (e.target as HTMLElement)?.tagName;
    const typing = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

    // open
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("fm:open-search"));
      return;
    }
    // close
    if (open && e.key === "Escape") {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent("fm:close-search"));
      return;
    }
    // nav / enter
    if (open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter")) {
      e.preventDefault();
      if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, results.length - 1));
      if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
      if (e.key === "Enter") handleGo(results[active]);
    }
  });

  // Index (permet d’injecter un index global si dispo)
  const idx: Item[] = useMemo(() => {
    // @ts-expect-error: injection optionnelle côté app
    const injected: Item[] | undefined = window.__FM_SEARCH_INDEX__;
    return injected?.length ? injected : DEFAULT_INDEX;
  }, []);

  // Résultats
  const results = useMemo(() => {
    if (!q.trim()) return idx.slice(0, 8);
    const nq = norm(q);
    return idx.filter(
      (it) =>
        norm(it.title).includes(nq) ||
        norm(it.href).includes(nq) ||
        norm(it.group ?? "").includes(nq)
    );
  }, [q, idx]);

  function close() {
    window.dispatchEvent(new CustomEvent("fm:close-search"));
  }
  function handleGo(it?: Item) {
    if (!it) return;
    if (it.href.startsWith("#")) {
      // ancre / hash
      window.location.hash = it.href.slice(1);
    } else {
      navigate(it.href);
    }
    close();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-label="Recherche">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity ${enter ? "opacity-100" : "opacity-0"}`}
        onClick={close}
      />

      {/* Panel full screen qui glisse de droite → gauche */}
      <div
        className={[
          "absolute inset-0",
          "supports-[backdrop-filter]:bg-skin-surface/80 bg-skin-surface/95 backdrop-blur-md",
          "ring-1 ring-skin-border/15 shadow-2xl",
          "transition-transform duration-300 ease-out",
          enter ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        {/* Barre supérieure */}
        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-skin-border/15">
          <Search className="w-5 h-5 opacity-80" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder="Rechercher…"
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-skin-muted"
          />
          <button
            onClick={close}
            className="text-skin-muted hover:text-skin-base px-2 py-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
            aria-label="Fermer la recherche"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Résultats */}
        <div className="px-3 sm:px-6 py-3 overflow-y-auto max-h-[calc(100vh-56px)] no-scrollbar">
          {results.length === 0 ? (
            <div className="text-sm text-skin-muted px-2 py-6">Aucun résultat pour “{q}”.</div>
          ) : (
            <ul className="space-y-2">
              {results.map((it, i) => {
                const activeCls =
                  i === active
                    ? "bg-skin-tile-strong/80 ring-1 ring-skin-border/20"
                    : "hover:bg-skin-tile/60 ring-1 ring-skin-border/10";
                return (
                  <li key={`${it.title}-${i}`}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => handleGo(it)}
                      className={[
                        "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left",
                        activeCls,
                        "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="
                            inline-flex items-center justify-center w-8 h-8 rounded-lg
                            bg-white/70 dark:bg-white/10 ring-1 ring-black/5 dark:ring-white/10
                          "
                        >
                          {it.icon ?? <Search className="w-4 h-4" />}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-skin-base truncate">{it.title}</div>
                          <div className="text-xs text-skin-muted truncate">
                            {it.group ? `${it.group} ` : ""}
                            <span className="opacity-70">{it.href}</span>
                          </div>
                        </div>
                      </div>
                      {it.locked ? (
                        <span className="text-[10px] uppercase tracking-wide rounded-full px-2 py-1 bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
                          Privé
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}