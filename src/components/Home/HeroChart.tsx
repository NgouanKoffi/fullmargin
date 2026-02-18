// src/components/Home/HeroChart.tsx
import heroImage from "../../assets/12.webp";

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
          w-[560px]                          /* 👉 plus large sur mobile */
          sm:w-[620px]
          md:w-[720px]
          lg:w-[920px]
          xl:w-[1000px]
        "
      >
        <img
          src={heroImage}
          alt="FullMargin Hero"
          className="
            w-full h-auto
            scale-[1.08]                      /* 👉 petit zoom mobile */
            sm:scale-100
            lg:scale-[1.08] xl:scale-[1.12]
            origin-center
            select-none
          "
        />
      </div>
    </div>
  );
}
