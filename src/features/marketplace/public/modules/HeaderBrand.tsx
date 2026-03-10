// src/pages/marketplace/public/modules/HeaderBrand.tsx
export default function HeaderBrand() {
  return (
    <div className="flex items-center gap-2">
      {/* Badge FM */}
      <div className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white font-bold">
        FM
      </div>
      {/* Texte MASQUÉ en mobile, visible ≥ md */}
      <div className="hidden md:block">
        <span className="text-lg font-semibold">FullMargin</span>{" "}
        <span className="opacity-70">Market</span>
      </div>
    </div>
  );
}
