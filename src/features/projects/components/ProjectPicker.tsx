// src/pages/projets/composants/ProjectPicker.tsx
import {
  ChevronDown,
  FolderGit2, // 👈 à la place de Camera
  Pencil,
  PlusCircle,
  Trash2,
} from "lucide-react";
import Dropdown from "./Dropdown";

export default function ProjectPicker({
  currentName,
  onNew,
  onEdit,
  onRename,
  onDelete,
}: {
  currentName?: string;
  onNew: () => void;
  onEdit?: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <Dropdown
      align="start"
      asChild
      trigger={
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10"
        >
          <FolderGit2 className="h-4 w-4 opacity-70" />
          <span className="font-semibold">{currentName ?? "—"}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      }
      items={[
        {
          label: "Nouveau projet",
          onClick: onNew,
          iconLeft: <PlusCircle className="h-4 w-4" />,
        },
        {
          label: "Modifier les détails",
          onClick: onEdit,
          disabled: !currentName || !onEdit,
          iconLeft: <Pencil className="h-4 w-4" />,
        },
        {
          label: "Renommer",
          onClick: onRename,
          disabled: !currentName,
          iconLeft: <Pencil className="h-4 w-4" />,
        },
        {
          label: "Supprimer",
          onClick: onDelete,
          danger: true,
          disabled: !currentName,
          iconLeft: <Trash2 className="h-4 w-4" />,
        },
      ]}
    />
  );
}
