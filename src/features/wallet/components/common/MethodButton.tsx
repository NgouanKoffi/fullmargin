// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\wallet\components\MethodButton.tsx
import clsx from "clsx";

interface MethodButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}

export function MethodButton({
  active,
  onClick,
  icon,
  label,
  sub,
}: MethodButtonProps) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={clsx(
        "relative flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 w-full",
        active
          ? "border-violet-600 bg-violet-50/50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 shadow-md"
          : "border-transparent bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-[1.02]",
      )}
    >
      {active && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-600"></span>
        </span>
      )}
      <div
        className={clsx(
          "transition-colors",
          active ? "text-violet-600" : "text-slate-400",
        )}
      >
        {icon}
      </div>
      <div className="text-center">
        <div className="text-sm font-bold leading-tight">{label}</div>
        <div className="text-xs opacity-70 mt-1 font-medium">{sub}</div>
      </div>
    </button>
  );
}
