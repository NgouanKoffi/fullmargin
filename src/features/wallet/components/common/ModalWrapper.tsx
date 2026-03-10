import React from "react";
import { createPortal } from "react-dom";

export function ModalWrapper({ children }: { children: React.ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm overflow-y-auto flex justify-center items-start pt-10 pb-10 px-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>,
    document.body,
  );
}
