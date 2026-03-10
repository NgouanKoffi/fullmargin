/**
 * Full Metrix - Premium Design System (2026)
 */

export const primaryBtn = `
  group relative inline-flex items-center justify-center gap-2 
  rounded-full bg-brand px-8 py-4 
  text-base font-bold text-white
  shadow-[0_20px_50px_rgba(124,58,237,0.3)]
  transition-all duration-300
  hover:scale-105 hover:bg-violet-500 hover:shadow-brand/50
  active:scale-95 disabled:opacity-50 disabled:cursor-wait
`;

export const secondaryBtn = `
  group relative inline-flex items-center justify-center gap-3 
  rounded-full border border-white/40 bg-white/10 px-8 py-4 
  text-base font-bold text-white
  backdrop-blur-md
  transition-all duration-300
  hover:bg-white/20 hover:border-white/60 hover:scale-105
  active:scale-95 disabled:opacity-50
`;

export const contentCard = `
  relative overflow-hidden 
  rounded-[40px] 
  bg-white/60 dark:bg-zinc-900/50 
  backdrop-blur-3xl 
  border border-zinc-200 dark:border-white/10
  p-8 md:p-12
  transition-all duration-500
  hover:border-brand/40 hover:shadow-[0_25px_80px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_25px_80px_rgba(0,0,0,0.5)]
`;

export const mediaFrame = `
  group/media w-full rounded-[30px] overflow-hidden 
  border-2 border-transparent 
  bg-gradient-to-br from-violet-500/30 via-violet-500/20 to-violet-600/30 
  dark:from-violet-500/40 dark:via-violet-500/30 dark:to-violet-600/40 
  bg-white 
  shadow-[0_20px_70px_rgba(123,97,255,0.2),0_8px_24px_rgba(123,97,255,0.12)] 
  dark:bg-black/40 dark:shadow-[0_20px_70px_rgba(123,97,255,0.35),0_8px_24px_rgba(123,97,255,0.2)] 
  hover:shadow-[0_24px_80px_rgba(123,97,255,0.3),0_12px_32px_rgba(123,97,255,0.18)] 
  dark:hover:shadow-[0_24px_80px_rgba(123,97,255,0.45),0_12px_32px_rgba(123,97,255,0.25)] 
  transition-all duration-500 
  hover:scale-[1.02] 
  hover:ring-2 hover:ring-violet-400/50 dark:hover:ring-violet-400/60
`;

export const mediaWrap = `
  group rounded-[36px] p-3 
  bg-gradient-to-br from-white/90 via-white/80 to-white/70 backdrop-blur-sm 
  ring-1 ring-zinc-200/80 
  dark:from-white/8 dark:via-white/6 dark:to-white/4 dark:backdrop-blur-md 
  dark:ring-white/12 
  shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.2)] 
  transition-all duration-300 
  hover:ring-zinc-300/90 dark:hover:ring-white/20 
  hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)]
`;

export const badge = `
  inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold 
  bg-violet-100 text-violet-700 
  dark:bg-violet-500/20 dark:text-violet-300 
  ring-1 ring-violet-200/50 dark:ring-violet-400/30 
  shadow-sm
`;

export const gradientText = `
  bg-gradient-to-br from-violet-600 via-violet-600 to-violet-700 
  dark:from-violet-400 dark:via-violet-500 dark:to-violet-600 
  bg-clip-text text-transparent
`;
