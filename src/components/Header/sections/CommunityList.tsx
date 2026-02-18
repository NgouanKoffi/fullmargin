import { NavLink } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import { buildMenu } from "../menu";
import SkeletonList from "./SkeletonList";
import { tile, tileHover } from "../ui/tokens"; // ✅ on ne prend plus dangerTile/activeCls du module

// Styles locaux manquants dans tokens
const dangerTile =
  "bg-red-500/10 text-red-600 dark:text-red-300 ring-1 ring-red-500/25 hover:bg-red-500/15";
const activeCls = "bg-violet-600 text-white";

export default function CommunityList({
  revealOnHover = false,
}: {
  revealOnHover?: boolean;
}) {
  const { status, user, signOut } = useAuth();
  const roles = user?.roles ?? [];

  if (status === "loading")
    return <SkeletonList revealOnHover={revealOnHover} />;

  const items = buildMenu("community", { status, roles, onSignOut: signOut });

  const labelShow = "opacity-100 max-w-[220px] flex";
  const labelHide = [
    "hidden",
    "group-hover/dock:inline-flex group-hover/dock:opacity-100 group-hover/dock:max-w-[220px]",
    "group-focus-within/dock:inline-flex group-focus-within/dock:opacity-100 group-focus-within/dock:max-w-[220px]",
  ].join(" ");

  return (
    <div className="px-3 pt-2 pb-1 space-y-2">
      {items.map((i) => {
        const content = (
          <>
            <span className="shrink-0 w-6 h-6 flex items-center justify-center">
              {i.icon}
            </span>
            <span
              className={`${
                revealOnHover ? labelHide : labelShow
              } items-center gap-1`}
            >
              {i.label}
            </span>
          </>
        );

        const base = i.variant === "danger" ? dangerTile : tile;
        const common =
          "transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring flex items-center w-full " +
          (revealOnHover
            ? [
                "h-10 justify-center rounded-full",
                "group-hover/dock:w-full group-hover/dock:h-auto group-hover/dock:rounded-xl group-hover/dock:px-3 group-hover/dock:py-2 group-hover/dock:justify-start group-hover/dock:gap-3",
                "group-focus-within/dock:w-full group-focus-within/dock:h-auto group-focus-within/dock:rounded-xl group-focus-within/dock:px-3 group-focus-within/dock:py-2 group-focus-within/dock:justify-start group-focus-within/dock:gap-3",
              ].join(" ")
            : "rounded-xl p-2 justify-start gap-3");

        if (!i.href) {
          return (
            <button
              key={`btn-${i.label}`}
              type="button"
              onClick={i.onClick}
              className={`${base} ${common} text-left ${tileHover}`}
            >
              {content}
            </button>
          );
        }
        if (i.href.startsWith("#")) {
          return (
            <button
              key={`hash-${i.href}`}
              type="button"
              className={`${base} ${tileHover} ${common}`}
            >
              {content}
            </button>
          );
        }
        if (/^https?:\/\//i.test(i.href)) {
          return (
            <a
              key={`ext-${i.href}`}
              href={i.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${base} ${tileHover} ${common}`}
            >
              {content}
            </a>
          );
        }
        return (
          <NavLink
            key={`in-${i.href}`}
            to={i.href}
            end={i.href === "/"}
            className={({ isActive }) =>
              [base, common, isActive ? activeCls : tileHover].join(" ")
            }
          >
            {content}
          </NavLink>
        );
      })}
    </div>
  );
}
