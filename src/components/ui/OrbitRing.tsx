// src/components/ui/OrbitRing.tsx

type Props = {
  active?: boolean;
  size?: number; // diamètre en px
};

export default function OrbitRing({ active = true, size = 30 }: Props) {
  if (!active) return null;

  return (
    <span
      aria-hidden
      className="
        pointer-events-none
        absolute
        left-1/2 top-1/2
        -translate-x-1/2 -translate-y-1/2
      "
      style={{ width: size, height: size }}
    >
      <span
        className="
          absolute inset-0 rounded-full
          border-[2px]
          border-violet-400/75
          border-t-red-400/90
          animate-[spin_1.4s_linear_infinite]
        "
      />
    </span>
  );
}
