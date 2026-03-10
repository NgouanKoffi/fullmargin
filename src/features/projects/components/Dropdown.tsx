// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\projets\composants\Dropdown.tsx
import React, {
  useEffect,
  useRef,
  useState,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";

export type Item = {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  iconLeft?: ReactNode;
};

type Align = "start" | "end";

export default function Dropdown({
  trigger,
  items,
  align = "end",
  asChild = false,
  menuWidth,
  menuClassName,
  buttonClassName,
}: {
  trigger: ReactNode;
  items: Item[];
  align?: Align;
  /** si true, n’enveloppe PAS le trigger dans un <button> (évite les boutons imbriqués) */
  asChild?: boolean;
  menuWidth?: string;
  menuClassName?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position calculée du menu (fixed, en portal)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // --- Ouverture / fermeture (click dehors + Esc)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const trg = triggerRef.current;
      const menu = menuRef.current;
      const t = e.target as Node | null;
      if (
        t &&
        (trg?.contains(t) || menu?.contains(t) || rootRef.current?.contains(t))
      ) {
        return; // clic à l'intérieur
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // --- Positionnement (au toggle, resize, scroll)
  const place = () => {
    const trg = triggerRef.current;
    const menu = menuRef.current;
    if (!trg || !menu) return;

    const rect = trg.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const gap = 8; // marge
    const preferredTop = rect.bottom + 6;

    // on doit connaître la largeur/hauteur du menu
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;

    // Alignement horizontal
    let left = align === "end" ? rect.right - mw : rect.left; // left “end” = right - width
    left = Math.max(gap, Math.min(left, viewportW - mw - gap));

    // Si pas la place en bas, on ouvre AU-DESSUS
    let top = preferredTop;
    if (preferredTop + mh > viewportH - gap) {
      const above = rect.top - mh - 6;
      if (above >= gap) top = above;
    }
    // clamp vertical minimal
    top = Math.max(gap, Math.min(top, viewportH - mh - gap));

    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return;
    // positionner une première fois
    place();

    // re-placer après la frame (au cas où styles async)
    const id = requestAnimationFrame(place);

    const onResize = () => place();
    const onScroll = () => place();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true); // capture true: scroll parents

    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align]);

  const commonTriggerProps = {
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen((v) => !v);
    },
    "aria-haspopup": "menu" as const,
    "aria-expanded": open,
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
      // Support asChild où le ref pourrait être écrasé
      if (isValidElement(trigger)) {
        const anyEl = trigger as unknown as {
          ref?: (n: HTMLElement | null) => void;
        };
        if (typeof anyEl?.ref === "function") anyEl.ref(node);
      }
    },
  };

  const TriggerEl =
    asChild && isValidElement(trigger) ? (
      cloneElement(trigger as ReactElement, commonTriggerProps)
    ) : (
      <button
        type="button"
        className={
          buttonClassName ??
          "rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10"
        }
        {...commonTriggerProps}
      >
        {trigger}
      </button>
    );

  // Menu (rendu dans portal)
  const menuNode = open ? (
    <div
      ref={menuRef}
      className="fixed z-[1000]" // très haut pour passer au-dessus des sheets/footers
      style={{
        top: pos?.top ?? -9999,
        left: pos?.left ?? -9999,
        minWidth: menuWidth ?? "180px",
      }}
    >
      <div
        role="menu"
        className={[
          "rounded-xl border border-black/10 dark:border-white/10",
          "bg-white dark:bg-neutral-900 shadow-2xl p-1",
          "ring-1 ring-black/5 dark:ring-white/5",
          menuClassName ?? "",
        ].join(" ")}
      >
        {items.map((it, i) => {
          const base =
            "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2";
          const tone = it.danger
            ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
            : it.disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-black/5 dark:hover:bg-white/10";
          return (
            <button
              key={`${i}-${it.label}`}
              type="button"
              role="menuitem"
              disabled={it.disabled}
              className={`${base} ${tone}`}
              onClick={() => {
                if (it.disabled) return;
                setOpen(false);
                it.onClick?.();
              }}
            >
              {it.iconLeft && <span className="opacity-70">{it.iconLeft}</span>}
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  ) : null;

  return (
    <div ref={rootRef} className="relative inline-block">
      {TriggerEl}
      {open ? createPortal(menuNode, document.body) : null}
    </div>
  );
}
