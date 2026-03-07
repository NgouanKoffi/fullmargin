// src/components/Home/BlogGallery.tsx
import React, { useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { motion, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowRight, CalendarDays } from "lucide-react";

/* -------------------------- Types & Demo data -------------------------- */
type Post = {
  id: string;
  title: string;
  excerpt?: string;
  date: string;
  image: string;
  category?: string;
};

const POSTS: Post[] = [
  {
    id: "lead",
    title: "Comment bâtir une communauté de traders solide et engagée",
    excerpt:
      "Créer un espace bienveillant et dynamique pour progresser, partager des opportunités et gagner en confiance.",
    date: "2025-10-20",
    category: "Communautés",
    image:
      "https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1500&auto=format&fit=crop",
  },
  {
    id: "s1",
    title: "Astuces pour réussir son premier mois de trading sans stress",
    date: "2025-10-18",
    category: "Débutants",
    image:
      "https://images.unsplash.com/photo-1496302662116-35cc4f36df92?q=80&w=1400&auto=format&fit=crop",
  },
  {
    id: "s2",
    title: "Le rôle du réseautage pour les investisseurs indépendants",
    date: "2025-10-15",
    category: "Mindset",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1400&auto=format&fit=crop",
  },
];

const GALLERY: string[] = [
  "https://images.unsplash.com/photo-1529078155058-5d716f45d604?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=1500&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1500&auto=format&fit=crop",
];

/* ------------------------------- TiltCard ------------------------------ */
function TiltCard({
  children,
  className = "",
  intensity = 10,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 180,
    damping: 20,
  });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 180,
    damping: 20,
  });
  const scale = useSpring(1, { stiffness: 200, damping: 25 });

  function onMove(e: ReactMouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }
  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => scale.set(1.015)}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
        scale.set(1);
      }}
      style={{ rotateX: rx, rotateY: ry, scale }}
      className={`transform-gpu will-change-transform ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ----------------------------- Fixed ribbon --------------------------- */
function DateRibbon({ date }: { date: string }) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("fr-FR", { month: "short" }).replace(".", "");
  return (
    <div
      className="
        absolute left-3 top-3 md:top-4 z-20
        grid place-items-center rounded-xl
        bg-fm-primary text-skin-primary-foreground
        px-2 py-1 text-[11px] font-extrabold shadow-lg select-none pointer-events-none
      "
    >
      <div className="leading-none">{day}</div>
      <div className="-mt-0.5 opacity-90">{month}</div>
    </div>
  );
}

/* -------------------------------- Component ---------------------------- */
export default function BlogGallery() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start 85%", "end 20%"] });
  const float = useTransform(scrollYProgress, [0, 1], [0, -18]);

  const lead = POSTS[0];
  const right = POSTS.slice(1);

  return (
    <section className="w-full ">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          <span className="inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full ring-1 ring-skin-border/30 bg-skin-surface/70">
            Actualités & Blogs
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-skin-base">
            Derniers articles & tendances
          </h2>
        </div>

        {/* Main row */}
        <div ref={rootRef} className="mt-8 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          {/* Featured */}
          <TiltCard intensity={10}>
            <article className="relative rounded-2xl overflow-hidden ring-1 ring-skin-border/20 bg-skin-surface shadow-md">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={lead.image}
                  alt={lead.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                <DateRibbon date={lead.date} />
                <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] font-semibold text-white/90">
                  <CalendarDays className="w-4 h-4" />
                  {new Date(lead.date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              <div className="p-6 sm:p-7">
                {lead.category && (
                  <span className="inline-flex items-center text-[11px] font-semibold px-2 py-1 rounded-full bg-fm-primary/14 text-fm-primary ring-1 ring-fm-primary/25">
                    {lead.category}
                  </span>
                )}
                <h3 className="mt-2 text-xl sm:text-2xl font-extrabold text-skin-base">
                  {lead.title}
                </h3>
                <p className="mt-2 text-skin-muted">{lead.excerpt}</p>

                <div className="mt-4">
                  <a
                    href="#read"
                    className="inline-flex items-center gap-2 rounded-full bg-fm-primary text-skin-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-skin-ring"
                  >
                    Lire l’article <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </article>
          </TiltCard>

          {/* Right column */}
          <div className="grid grid-cols-1 gap-6">
            {right.map((p) => (
              <TiltCard key={p.id} intensity={10}>
                <article className="relative rounded-2xl overflow-hidden ring-1 ring-skin-border/20 bg-skin-surface shadow-md">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={p.image}
                      alt={p.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    <DateRibbon date={p.date} />
                  </div>
                  <div className="p-5">
                    {p.category && (
                      <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-skin-inset ring-1 ring-skin-border/40">
                        {p.category}
                      </span>
                    )}
                    <h4 className="mt-2 font-bold text-skin-base">{p.title}</h4>
                    <a
                      href="#read"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-fm-primary hover:opacity-90"
                    >
                      Lire <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </article>
              </TiltCard>
            ))}
          </div>
        </div>

        {/* Gallery */}
        <motion.div
          style={{ y: float }}
          className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {GALLERY.map((src, i) => (
            <div key={i} className="group relative">
              <TiltCard intensity={8}>
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-skin-border/20 bg-skin-surface shadow-sm">
                  <img
                    src={src}
                    alt={`gallery-${i}`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-white/0 via-white/20 to-white/0 dark:via-white/10 opacity-0 group-hover:opacity-100 animate-[shine_4s_linear_infinite]" />
                  </div>
                </div>
              </TiltCard>
            </div>
          ))}
        </motion.div>
      </div>

      <style>{`@keyframes shine{0%{transform:translateX(-20%);}100%{transform:translateX(320%);}}`}</style>
    </section>
  );
}