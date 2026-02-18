// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\AdminGestionFab.tsx
import { Settings2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";

/**
 * Bouton discret, à droite au milieu, visible sur TOUTES les tailles d'écran.
 * - Admin OU Agent
 * - Ouvre la sidebar via fm:open-gestion
 * - Pas de logique de masquage : donc pas de besoin de refresh
 * - Z-index en dessous des grosses modales pour ne pas gêner
 */
export default function AdminGestionFab() {
  const { status, user } = useAuth();
  const roles = user?.roles ?? [];
  const isAdminOrAgent =
    status === "authenticated" &&
    (roles.includes("admin") || roles.includes("agent"));
  if (!isAdminOrAgent) return null;

  return (
    <div
      className="fixed right-0 top-1/2 -translate-y-1/2 z-[69] pointer-events-none"
      style={{ right: "max(0px, env(safe-area-inset-right, 0px))" }}
    >
      <button
        type="button"
        title="Gestion"
        aria-label="Ouvrir la gestion"
        onClick={() => {
          window.dispatchEvent(new CustomEvent("fm:open-gestion"));
        }}
        className={[
          "pointer-events-auto",
          "rounded-l-full",
          "w-8 h-12 sm:w-9 sm:h-14",
          "supports-[backdrop-filter]:bg-skin-header/40 bg-skin-header/70 backdrop-blur-md",
          "ring-1 ring-skin-border/20 shadow-lg",
          "flex items-center justify-center",
          "translate-x-[6px] hover:translate-x-0 focus:translate-x-0",
          "transition-[transform,opacity,background-color] duration-200 ease-out",
          "opacity-70 hover:opacity-100 focus:opacity-100",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring",
        ].join(" ")}
      >
        <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  );
}
