// src/pages/marketplace/tabs/shop/components/SuccessAnimation.tsx
import { useEffect, useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";

interface SuccessAnimationProps {
  onComplete?: () => void;
  duration?: number; // Duration in ms before calling onComplete
}

export default function SuccessAnimation({
  onComplete,
  duration = 1500,
}: SuccessAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Call onComplete after duration
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
        @keyframes successPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes sparkleFloat {
          0% { transform: translateY(0) scale(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-30px) scale(1); opacity: 0; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Success Card */}
        <div
          className={`relative rounded-3xl bg-white dark:bg-neutral-900 p-8 shadow-2xl transition-all duration-500 ${
            isVisible
              ? "scale-100 opacity-100"
              : "scale-75 opacity-0"
          }`}
        >
          {/* Sparkles */}
          <div className="absolute -top-4 -left-4">
            <Sparkles
              className="size-8 text-yellow-400"
              style={{
                animation: isVisible ? "sparkleFloat 1.5s ease-out" : "none",
              }}
            />
          </div>
          <div className="absolute -top-2 -right-2">
            <Sparkles
              className="size-6 text-violet-400"
              style={{
                animation: isVisible
                  ? "sparkleFloat 1.5s ease-out 0.2s"
                  : "none",
              }}
            />
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
            <Sparkles
              className="size-7 text-emerald-400"
              style={{
                animation: isVisible
                  ? "sparkleFloat 1.5s ease-out 0.4s"
                  : "none",
              }}
            />
          </div>

          {/* Main Content */}
          <div className="flex flex-col items-center gap-4 text-center">
            {/* Checkmark Icon */}
            <div
              className="relative flex items-center justify-center"
              style={{
                animation: isVisible
                  ? "successScale 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  : "none",
              }}
            >
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl" />
              <div className="relative rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 p-4">
                <CheckCircle2 className="size-16 text-white" strokeWidth={2.5} />
              </div>
            </div>

            {/* Success Text */}
            <div
              className={`transition-all duration-500 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-4 opacity-0"
              }`}
            >
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Boutique créée avec succès !
              </h3>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Découvrez comment ça marche...
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
