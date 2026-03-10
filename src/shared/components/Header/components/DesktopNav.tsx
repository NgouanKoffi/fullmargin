// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\DesktopNav.tsx
import { ChevronDown, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@core/auth/AuthContext";
import type { HeaderNavGroup, HeaderNavItem } from "../navConfig";

type Props = {
  groups: HeaderNavGroup[];
};

const FALLBACK_HREF = "/";

// ✅ correction: on ne doit jamais retourner "" pour "/"
const normalizePath = (p: string) => {
  const cleaned = (p || "/").replace(/\/+$/, "");
  return cleaned === "" ? "/" : cleaned;
};

/**
 * 👉 règle:
 * - si la cible === "/" → actif SEULEMENT si on est exactement sur "/"
 * - sinon → actif si le chemin est égal OU commence par ce chemin
 */
const isPathActive = (currentPath: string, targetHref?: string) => {
  if (!targetHref) return false;
  const cur = normalizePath(currentPath);
  const [tgtPath] = targetHref.split("?");
  const tgt = normalizePath(tgtPath || "/");

  // cas spécial Accueil
  if (tgt === "/") {
    return cur === "/";
  }

  return cur === tgt || cur.startsWith(tgt + "/");
};

/**
 * pour les sous-liens du dropdown → on compare aussi la query
 */
const isHrefStrictActive = (
  currentPath: string,
  currentSearch: string,
  href?: string
): boolean => {
  if (!href) return false;
  const [tgtPathRaw, tgtSearchRaw] = href.split("?");
  const tgtPath = normalizePath(tgtPathRaw || "/");
  const curPath = normalizePath(currentPath);

  if (curPath !== tgtPath) return false;
  if (!tgtSearchRaw || !tgtSearchRaw.trim()) return true;
  return currentSearch === `?${tgtSearchRaw}`;
};

const parentActiveCls =
  "bg-violet-600 text-white ring-2 ring-violet-700 shadow-[0_0_0_3px_rgba(109,40,217,0.25)]";

// 👇 clés des items “Mes outils” à protéger par l’auth
const TOOL_PROTECTED_KEYS = new Set<string>([
  "tools-notes",
  "tools-tasks",
  "tools-finances",
  "tools-journal",
  "tools-fullmetrix",
  "tools-podcasts",
]);

export default function DesktopNav({ groups }: Props) {
  const { pathname, search } = useLocation();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  const { status } = useAuth();
  const isAuthed = status === "authenticated";

  const openAuth = (mode: "signin" | "signup" = "signin") =>
    window.dispatchEvent(
      new CustomEvent("fm:open-account", { detail: { mode } })
    );

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!navRef.current) return;
      if (!navRef.current.contains(e.target as Node)) setOpenKey(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenKey(null);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const toggleMenu = (key: string) => {
    setOpenKey((k) => (k === key ? null : key));
  };

  return (
    <nav
      aria-label="Navigation principale"
      className="hidden min-[1175px]:block"
    >
      <div
        ref={navRef}
        className="
          flex items-center gap-1 rounded-full px-1.5 py-1
          ring-1 ring-skin-border/15
          supports-[backdrop-filter]:bg-skin-header/40 bg-skin-header/60 backdrop-blur-md
          shadow-[0_1px_0_0_rgba(0,0,0,.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,.06)]
        "
      >
        {groups.map((g) => {
          const hasChildren = Array.isArray(g.items) && g.items.length > 0;

          // ===== lien simple (Accueil, À propos, …) =====
          if (!hasChildren) {
            const to = g.href?.trim().length ? g.href : FALLBACK_HREF;
            const active = isPathActive(pathname, to);

            if (g.isSpecial) {
              return (
                <Link
                  key={g.key}
                  to={to}
                  className={`
                    relative rounded-full px-4 py-2 text-sm whitespace-nowrap flex items-center gap-1.5 font-bold tracking-wide
                    hover:bg-white/10 dark:hover:bg-white/10 transition-colors group
                    ${active ? 'bg-white/5 dark:bg-white/10' : ''}
                  `}
                >
                  <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400">
                    {g.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={g.key}
                to={to}
                className={`
                  relative rounded-full px-4 py-2 text-sm whitespace-nowrap flex items-center gap-1
                  text-skin-base/90 hover:text-skin-base
                  hover:bg-white/10 dark:hover:bg-white/10
                  ${active ? parentActiveCls : ""}
                `}
              >
                {g.label}
              </Link>
            );
          }

          // ===== groupe avec dropdown =====
          const parentHref = g.href?.trim().length ? g.href : undefined;
          const hasActiveChild =
            g.items?.some((it) =>
              isHrefStrictActive(pathname, search, it.href)
            ) ?? false;

          const isParentActive =
            (parentHref && isPathActive(pathname, parentHref)) ||
            hasActiveChild;

          const isOpen = openKey === g.key;

          return (
            <div key={g.key} className="relative">
              <button
                type="button"
                className={`
                  relative rounded-full px-4 py-2 text-sm
                  text-skin-base/90 hover:text-skin-base
                  transition-colors hover:bg-white/10 dark:hover:bg-white/10
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring
                  whitespace-nowrap flex items-center gap-1
                  ${isParentActive ? parentActiveCls : ""}
                `}
                aria-haspopup="menu"
                aria-expanded={isOpen ? "true" : "false"}
                aria-current={isParentActive ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleMenu(g.key);
                }}
              >
                {g.label}
                <ChevronDown
                  className={`w-4 h-4 opacity-80 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
                {g.badge ? (
                  <span
                    className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold shadow"
                    aria-label={`${g.badge} notification(s)`}
                  >
                    {g.badge > 99 ? "99+" : g.badge}
                  </span>
                ) : null}
              </button>

              {isOpen && (
                <div
                  role="menu"
                  className="
                      absolute left-0 mt-2 min-w-64
                      rounded-2xl p-2
                      bg-white/95 dark:bg-[#0f1115]/95 backdrop-blur-md
                      ring-1 ring-black/5 dark:ring-white/10 shadow-xl
                      z-50
                      max-h-[60vh] overflow-y-auto overscroll-contain pr-1
                    "
                  aria-label={`Menu ${g.label}`}
                >
                  {g.items?.map((it: HeaderNavItem) => {
                    const to =
                      it.href && it.href.trim().length
                        ? it.href
                        : FALLBACK_HREF;
                    const active = isHrefStrictActive(pathname, search, to);
                    const isProtectedTool = TOOL_PROTECTED_KEYS.has(it.key);

                    return (
                      <Link
                        key={it.key}
                        to={to}
                        className={`flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm transition-colors
                          ${
                            active
                              ? "bg-violet-600 text-white"
                              : "text-skin-base/90 hover:text-skin-base hover:bg-black/5 dark:hover:bg-white/10"
                          }`}
                        role="menuitem"
                        onClick={(e) => {
                          // 🔒 protection Mes outils → ouvre AuthModal si pas connecté
                          if (!isAuthed && isProtectedTool) {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenKey(null);
                            openAuth("signin");
                            return;
                          }
                          setOpenKey(null);
                        }}
                      >
                        {it.icon && (
                          <span
                            className="inline-flex items-center justify-center
                                       w-8 h-8 rounded-full
                                       bg-violet-500/10 dark:bg-white/10
                                       ring-1 ring-black/5 dark:ring-white/10
                                       shrink-0"
                          >
                            {it.icon}
                          </span>
                        )}
                        <span className="truncate flex-1">{it.label}</span>
                        {it.badge ? (
                          <span className="inline-flex items-center justify-center min-w-[1.2rem] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                            {it.badge > 99 ? "99+" : it.badge}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
