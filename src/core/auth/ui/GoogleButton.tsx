// src/auth/ui/GoogleButton.tsx
import { FcGoogle } from "react-icons/fc";

type Props = {
  onClick: () => void;
};

export default function GoogleButton({ onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        w-full rounded-xl ring-1 ring-skin-border/30 hover:ring-skin-border/50
        bg-white/80 dark:bg-white/[.06] backdrop-blur
        px-4 py-3 text-sm font-medium flex items-center justify-center gap-2
        transition-all
      "
    >
      <FcGoogle className="text-xl" />
      Continuer avec Google
    </button>
  );
}