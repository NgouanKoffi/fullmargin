// src/components/Home/HeroChart.tsx
import heroImage from "@assets/12.webp";

export default function HeroChart() {
  return (
    <div className="relative h-[240px] sm:h-[300px] lg:h-[430px] overflow-visible">
      <div
        className="
          absolute
          top-1/2 -translate-y-1/2
          left-1/2 -translate-x-1/2          /* centré mobile */
          lg:left-auto lg:translate-x-0 lg:right-0
          pointer-events-none
          w-[130%]                           /* 👉 plus large sur mobile, dépasse proprement */
          max-w-[560px]
          sm:max-w-[620px]
          md:max-w-[720px]
          lg:w-[920px] lg:max-w-none
          xl:w-[1000px]
        "
      >
        <div className="relative group perspective-[1000px]">
          {/* Subtle glow behind the image */}
          <div className="absolute inset-0 bg-gradient-to-tr from-fm-primary/30 to-fm-accent/30 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          <img
            src={heroImage}
            alt="FullMargin Hero"
            className="
              relative z-10
              w-full h-auto
              scale-[1.08]                      /* 👉 petit zoom mobile */
              sm:scale-100
              lg:scale-[1.08] xl:scale-[1.12]
              origin-center
              select-none
              transition-all duration-700 ease-out
              group-hover:-translate-y-4 group-hover:scale-[1.1] xl:group-hover:scale-[1.15]
              group-hover:drop-shadow-[0_20px_40px_rgba(111,60,255,0.25)]
            "
          />
        </div>
      </div>
    </div>
  );
}
