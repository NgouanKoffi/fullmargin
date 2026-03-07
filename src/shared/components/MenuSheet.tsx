import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@core/auth/AuthContext";
import { useMenu, type Kind } from "./Header/utils/menu";
import BaseSheet from "./Header/sheets/BaseSheet";

type Props = {
  kind: Kind;
  open: boolean;
  onClose: () => void;
};

export default function MenuSheet({ kind, open, onClose }: Props) {
  const navigate = useNavigate();
  const { status, user, signOut } = useAuth();

  const roles = useMemo(() => {
    const r = (user as any)?.roles;
    return Array.isArray(r) ? (r as string[]) : [];
  }, [user]);

  const menu = useMenu(kind, {
    status,
    roles,
    onSignOut: signOut,
  });

  const title = kind === "market" ? "Marketplace" : "Menu";

  return (
    <BaseSheet
      open={open}
      onClose={onClose}
      title={title}
      labelledById="menu-sheet-title"
    >
      <ul className="grid grid-cols-1 gap-2 py-2">
        {menu.map((item, idx) => {
          const isDanger = item.variant === "danger";

          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                  } else if (item.href) {
                    navigate(item.href);
                  }
                  onClose();
                }}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isDanger
                    ? "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20"
                    : "bg-black/5 text-slate-700 dark:bg-white/5 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10"
                }`}
              >
                <span className={isDanger ? "text-rose-500" : "text-slate-500 dark:text-slate-400"}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </BaseSheet>
  );
}
