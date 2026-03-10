// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Header\ui\ActiveLink.tsx
import { NavLink } from "react-router-dom";
import type { ReactNode, ComponentPropsWithoutRef } from "react";
import { activeCls } from "./tokens";

type OwnProps = {
  to: string;
  children: ReactNode;
  base: string; // classes de base (padding, arrondi…)
  hover?: string; // classes pour l'état inactif au survol
};

type Props = Omit<
  ComponentPropsWithoutRef<typeof NavLink>,
  "to" | "className" | "children"
> &
  OwnProps;

export function ActiveLink({ to, children, base, hover = "", ...rest }: Props) {
  return (
    <NavLink
      to={to}
      {...rest}
      className={({ isActive }: { isActive: boolean }) =>
        isActive ? `${base} ${activeCls}` : `${base} ${hover}`
      }
    >
      {children}
    </NavLink>
  );
}
