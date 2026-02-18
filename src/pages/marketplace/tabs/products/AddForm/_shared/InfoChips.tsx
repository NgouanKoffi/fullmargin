// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\products\AddForm\_shared\InfoChips.tsx
import { Timer, ShieldCheck, BadgeCheck } from "lucide-react";

export default function InfoChips({
  needsVerification,
  canBadge, // candidat
  badgeGranted,
  delay,
}: {
  needsVerification: boolean;
  canBadge: boolean;
  badgeGranted: boolean;
  delay: "admin" | "immediate";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Chip
        icon={<Timer className="w-4 h-4" />}
        text={
          delay === "admin"
            ? "Publication après validation"
            : "Publication immédiate"
        }
      />

      <Chip
        icon={<ShieldCheck className="w-4 h-4" />}
        text={
          needsVerification
            ? "Vérification requise"
            : "Vérification non requise"
        }
      />

      <Chip
        icon={<BadgeCheck className="w-4 h-4" />}
        text={
          badgeGranted
            ? "Badge attribué"
            : canBadge
            ? "Badge après contrôle admin"
            : "Badge non éligible"
        }
      />
    </div>
  );
}

function Chip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.06] px-3 py-1 text-xs">
      <span className="opacity-80">{icon}</span>
      <span className="opacity-90">{text}</span>
    </span>
  );
}
