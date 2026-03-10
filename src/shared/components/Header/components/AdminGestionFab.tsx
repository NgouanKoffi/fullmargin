// src/components/Header/AdminGestionFab.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Settings2 } from "lucide-react";
import { useAuth } from "@core/auth/AuthContext";

export default function AdminGestionFab() {
  const { status, user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status !== "authenticated") return null;

  const roles = user?.roles || [];
  const canSeeGestion = roles.includes("admin") || roles.includes("agent");
  if (!canSeeGestion) return null;

  return (
    <>
      {/* Desktop Helper */}
      <div className="hidden lg:block fixed left-4 bottom-4 z-[9999]">
        <Link
          to="/admin/messages?open=gestion"
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-500/20 transition-all hover:scale-105 ring-1 ring-white/10"
        >
          <Settings2 className="w-5 h-5 animate-spin-slow" />
          <span className="font-semibold text-sm">Portail Administrateur</span>
        </Link>
      </div>

      {/* Mobile Fab */}
      <div className="lg:hidden fixed right-4 bottom-[88px] z-50 transition-transform fm-admin-fab">
        <Link
          to="/admin/messages?open=gestion"
          className="flex items-center justify-center w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-xl shadow-violet-500/30 transition-transform active:scale-95 ring-1 ring-white/20"
        >
          <Settings2 className="w-6 h-6 animate-spin-slow" />
        </Link>
      </div>

      <style>{`
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        [data-hide-support="true"] .fm-admin-fab {
          transform: translateY(150px);
        }
      `}</style>
    </>
  );
}
