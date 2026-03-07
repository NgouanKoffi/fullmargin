// src/features/admin/communities/components/TabButton.tsx
type Props = {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
};

export function TabButton({ active, onClick, icon: Icon, label }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition whitespace-nowrap ${
        active
          ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
          : "text-skin-muted hover:text-skin-base hover:bg-skin-surface border border-transparent hover:border-skin-border/30"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}
