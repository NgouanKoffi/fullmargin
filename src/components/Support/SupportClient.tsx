// C:\Users\ADMIN\Desktop\fullmargin-site\src\components\Support\SupportClient.tsx
import { Help } from "../Header/icons";

export default function SupportClient() {
  return (
    <nav
      className="fm-support-fab fixed z-[59]"
      aria-label="Action support"
      style={{
        right: "max(16px, env(safe-area-inset-right, 0px))",
        bottom: "max(16px, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <button
        type="button"
        aria-label="Support"
        title="Support"
        onClick={() => window.dispatchEvent(new CustomEvent("fm:open-support"))}
        className="w-12 h-12 rounded-full shadow-xl ring-1 ring-black/10
                   flex items-center justify-center active:scale-95 transition-transform
                   bg-[#ff4242] text-white"
      >
        <Help className="w-5 h-5" />
      </button>
    </nav>
  );
}
