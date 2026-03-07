// src/features/admin/communities/components/EmptyState.tsx
type Props = { label: string; icon: React.ElementType };

export function EmptyState({ label, icon: Icon }: Props) {
  return (
    <div className="text-center py-16 bg-skin-surface rounded-2xl border border-dashed border-skin-border/40">
      <Icon className="w-12 h-12 text-skin-muted mx-auto mb-3 opacity-30" />
      <p className="text-skin-muted text-sm font-medium">{label}</p>
    </div>
  );
}
