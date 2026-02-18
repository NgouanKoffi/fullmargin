// src/layouts/WideWrap.tsx
import * as React from "react";

/**
 * Conteneur large multi-breakpoints.
 * Remplace tous les combos "container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
 * et les max-w figés (ex: max-w-[1280px]).
 *
 * Props :
 * - as   : élément polymorphique (div/section/main/…)
 * - pad  : "none" | "sm" | "md" | "lg"  -> padding horizontal
 * - max  : "wide" | "wider" | "ultra" | "full" -> largeur max
 */

type Pad = "none" | "sm" | "md" | "lg";
type Max = "wide" | "wider" | "ultra" | "full";

const PAD: Record<Pad, string> = {
  none: "",
  sm: "px-3 sm:px-4",
  md: "px-4 sm:px-6 lg:px-8",
  lg: "px-5 sm:px-8 lg:px-10",
};

const MAX: Record<Max, string> = {
  wide: "max-w-screen-2xl",
  wider:
    "max-w-screen-2xl 3xl:max-w-[1600px] 4xl:max-w-[1800px] uw:max-w-[2000px] su:max-w-[2400px]",
  ultra:
    "max-w-screen-2xl 3xl:max-w-[1800px] 4xl:max-w-[2000px] uw:max-w-[2200px] su:max-w-[2600px]",
  full: "max-w-none",
};

// ---- Typage polymorphique sans JSX.IntrinsicElements ----
type ElementType = React.ElementType;

type OwnProps = {
  pad?: Pad;
  max?: Max;
  className?: string;
  children?: React.ReactNode;
};

type PolymorphicProps<E extends ElementType> = OwnProps &
  Omit<React.ComponentPropsWithoutRef<E>, keyof OwnProps | "as"> & {
    as?: E;
  };

export default function WideWrap<E extends ElementType = "div">(
  props: PolymorphicProps<E>
) {
  const {
    as,
    pad = "md",
    max = "wider",
    className = "",
    children,
    ...rest
  } = props;
  const Tag = (as || "div") as ElementType;

  const base = "mx-auto w-full";
  const cls = [base, PAD[pad], MAX[max], className].filter(Boolean).join(" ");

  return (
    <Tag className={cls} {...(rest as Record<string, unknown>)}>
      {children}
    </Tag>
  );
}
