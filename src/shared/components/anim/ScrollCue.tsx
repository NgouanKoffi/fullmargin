import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

/**
 * ScrollCue passif : pas de h-screen, pas d'overflow, pas de positionnement.
 * Il se contente d'écouter l'intersection et d'ajouter une classe.
 */
export default function ScrollCue({ children }: Props) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-cue]"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const el = e.target as HTMLElement;
            const delay = Number(el.getAttribute("data-delay") || 0);
            setTimeout(() => el.classList.add("cue-in"), delay);
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // IMPORTANT : ne pas créer un nouveau scroll-container
  return <div className="contents overflow-visible">{children}</div>;
}