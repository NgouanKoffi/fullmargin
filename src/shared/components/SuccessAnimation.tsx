import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

interface SuccessAnimationProps {
  onComplete?: () => void;
  duration?: number;
  title?: string;
  subtitle?: string;
}

export default function SuccessAnimation({
  onComplete,
  duration = 1500,
  title = "Opération réussie !",
  subtitle = "Tout s'est bien passé.",
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    const timer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <>
      <style>{`
        @keyframes successScale {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.1) rotate(180deg); opacity: 1; }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        @keyframes sparkleFloat {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-30px) scale(1); opacity: 0; }
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`relative rounded-3xl bg-white dark:bg-neutral-900 p-8 shadow-2xl transition-all duration-500 border border-white/10 ${
            isVisible ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          <div className="absolute -top-4 -left-4">
            <Sparkles
              className="size-8 text-yellow-400"
              style={{ animation: isVisible ? "sparkleFloat 1.5s ease-out" : "none" }}
            />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles
              className="size-6 text-violet-400"
              style={{ animation: isVisible ? "sparkleFloat 1.5s ease-out 0.2s" : "none" }}
            />
          </div>

          <div className="flex flex-col items-center gap-4 text-center">
            <div
              className="relative flex items-center justify-center"
              style={{
                animation: isVisible
                  ? "successScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  : "none",
              }}
            >
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl" />
              <div className="relative rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 shadow-lg shadow-emerald-500/40">
                <CheckCircle2 className="size-16 text-white" strokeWidth={2.5} />
              </div>
            </div>

            <div
              className={`transition-all duration-500 delay-200 ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              }`}
            >
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                {subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
