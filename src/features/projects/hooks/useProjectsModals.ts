import { useState } from "react";
import type { Tache } from "../types";

export function useProjectsModals() {
  const [tacheEdit, setTacheEdit] = useState<Tache | null>(null);
  const [modalTacheOpen, setModalTacheOpen] = useState(false);
  const [openNewProj, setOpenNewProj] = useState(false);
  const [openRenameProj, setOpenRenameProj] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameInitial, setRenameInitial] = useState<string>("");
  const [openEditProj, setOpenEditProj] = useState(false);
  const [tacheView, setTacheView] = useState<Tache | null>(null);

  function ouvrirEdition(t?: Tache) {
    setTacheEdit(t ?? null);
    setModalTacheOpen(true);
  }

  function ouvrirRenommage(id: string, initialName: string) {
    setRenameId(id);
    setRenameInitial(initialName);
    setOpenRenameProj(true);
  }

  return {
    tacheEdit,
    setTacheEdit,
    modalTacheOpen,
    setModalTacheOpen,
    openNewProj,
    setOpenNewProj,
    openRenameProj,
    setOpenRenameProj,
    renameId,
    setRenameId,
    renameInitial,
    setRenameInitial,
    openEditProj,
    setOpenEditProj,
    tacheView,
    setTacheView,
    ouvrirEdition,
    ouvrirRenommage,
  };
}
