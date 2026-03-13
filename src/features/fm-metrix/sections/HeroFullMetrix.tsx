import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles, TrendingUp, Cpu, Activity, ShieldCheck, BarChart3 } from "lucide-react";
import TradingRobot from "@assets/fmmetrix/trading_robot.png";

type Props = {
  goToFM: () => void;
  isLoading: boolean;
};

export default function HeroFullMetrix({ goToFM, isLoading }: Props) {
  return (
    <section className="relative min-h-screen flex flex-col items-center pt-8 pb-24 overflow-hidden bg-transparent">

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 mt-4 md:mt-6 flex flex-col items-center">
        
        {/* 2. HERO TEXT CONTENT */}
        <div className="max-w-4xl text-center flex flex-col items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-white/5 border border-zinc-200/50 dark:border-white/10 backdrop-blur-md shadow-sm mb-8 transition-all hover:bg-white/60 dark:hover:bg-white/10 cursor-default"
          >
            <span className="flex h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400 animate-ping absolute opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600 dark:bg-violet-400"></span>
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 ml-2">Découvrez la nouvelle version 2.0</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tighter text-zinc-900 dark:text-white leading-[1.1] mb-6 drop-shadow-sm"
          >
            L'écosystème ultime pour{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 dark:from-violet-400 dark:via-fuchsia-400 dark:to-violet-400 bg-[length:200%_auto] animate-[fm-text-shimmer_6s_linear_infinite] bg-clip-text text-transparent">
                trader d'élite
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-[0.15em] bg-violet-500/20 dark:bg-violet-400/20 rounded-full blur-sm -z-10"></span>
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-light mb-10 max-w-2xl"
          >
            Passez à la vitesse supérieure. Journaling intelligent, analyse prédictive et assistant IA intégrés en une seule plateforme conçue pour les professionnels.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center"
          >
            <button
              onClick={goToFM}
              disabled={isLoading}
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-semibold text-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] w-full sm:w-auto"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 dark:opacity-0 dark:group-hover:opacity-10 transition-opacity duration-500"></div>
              {isLoading ? (
                <span className="h-5 w-5 rounded-full border-[2.5px] border-white/20 dark:border-zinc-950/20 border-t-white dark:border-t-zinc-950 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5 text-violet-300 dark:text-violet-600 relative z-10" />
              )}
              <span className="relative z-10">{isLoading ? "Ouverture..." : "Ouvrir Full Metrix"}</span>
              {!isLoading && <ArrowRight className="h-5 w-5 ml-1 relative z-10 group-hover:translate-x-1 transition-transform" />}
            </button>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("fmmetrix-features");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="inline-flex items-center justify-center gap-3 px-8 py-5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 border-b-zinc-300 dark:border-white/10 dark:border-b-white/5 text-zinc-700 dark:text-zinc-200 font-medium text-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all shadow-sm w-full sm:w-auto hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
                <Play className="h-4 w-4 ml-[2px]" />
              </div>
              Découvrir les specs
            </button>
          </motion.div>
        </div>

        {/* 3. ULTRA PREMIUM ROBOT SHOWCASE */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, type: "spring", stiffness: 50, damping: 20 }}
          className="w-full mt-24 relative max-w-6xl mx-auto"
        >
          {/* Main Showcase Container */}
          <div className="relative w-full rounded-[2.5rem] bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-zinc-200/80 dark:border-white/10 shadow-2xl dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row ring-1 ring-zinc-900/5 dark:ring-white/5">
            
            {/* Top Bar (Browser like) */}
            <div className="absolute top-0 left-0 right-0 h-14 border-b border-zinc-200/50 dark:border-white/5 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md flex items-center px-6 gap-2 z-30">
              <div className="w-3.5 h-3.5 rounded-full bg-rose-400"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-400"></div>
              <div className="ml-4 px-3 py-1 rounded-md bg-zinc-200/50 dark:bg-white/5 text-xs font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                <ShieldCheck className="h-3 w-3" />
                fm-metrix-engine.ai
              </div>
            </div>

            {/* Left Column: Metrics & Charts */}
            <div className="flex-1 p-8 pt-24 pb-12 flex flex-col justify-center gap-6 border-r border-zinc-200/50 dark:border-white/5 relative z-20">
              
              <div className="bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-1">Win Rate Moyen</p>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    78.4%
                    <span className="flex items-center text-sm font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +4.2%
                    </span>
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-violet-100 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center">
                  <BarChart3 className="h-6 w-6" />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/5 rounded-2xl p-6 shadow-sm pb-10">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-semibold text-zinc-900 dark:text-white">Analyse Prédictive (XAUUSD)</h3>
                  <div className="flex items-center gap-2 text-xs font-medium text-violet-600 bg-violet-100 dark:bg-violet-500/10 px-2.5 py-1 rounded-full">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-600 dark:bg-violet-400"></span>
                    </span>
                    En temps réel
                  </div>
                </div>
                {/* SVG Chart Line */}
                <div className="w-full h-24 relative flex items-end">
                  <svg className="w-full h-full text-violet-500 overflow-visible" viewBox="0 0 100 40" preserveAspectRatio="none">
                    {/* Shadow under line */}
                    <path d="M0,35 C15,35 25,15 40,25 C55,35 65,5 80,15 C90,20 95,5 100,5 L100,40 L0,40 Z" fill="url(#gradient)" opacity="0.2" className="dark:opacity-30" />
                    <defs>
                      <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Main Line */}
                    <path d="M0,35 C15,35 25,15 40,25 C55,35 65,5 80,15 C90,20 95,5 100,5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="drop-shadow-[0_5px_8px_rgba(139,92,246,0.3)] dark:drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                    {/* Glowing dots */}
                    <circle cx="40" cy="25" r="3" fill="white" stroke="currentColor" strokeWidth="2" className="drop-shadow-md" />
                    <circle cx="80" cy="15" r="3" fill="white" stroke="currentColor" strokeWidth="2" className="drop-shadow-md" />
                    <circle cx="100" cy="5" r="4" fill="white" stroke="currentColor" strokeWidth="2" className="drop-shadow-md animate-pulse" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Right Column: AI Robot Avatar */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 bg-zinc-50 dark:bg-black/50 min-h-[400px]">
              
              {/* Complex Glowing Core Behind Robot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-violet-400/30 dark:bg-violet-600/20 rounded-full blur-[80px] animate-[pulse_6s_ease-in-out_infinite]"></div>
              
              {/* Rotating Tech Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full border-[1px] border-dashed border-violet-500/20 dark:border-white/10 animate-[spin_30s_linear_infinite]"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border-[1px] border-zinc-300 dark:border-white/5 animate-[spin_40s_linear_infinite_reverse]"></div>

              {/* The Robot Identity */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-full border-4 border-white dark:border-zinc-800 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden bg-zinc-900 flex items-center justify-center"
              >
                <img 
                  src={TradingRobot} 
                  alt="AI Assistant Core" 
                  className="w-full h-full object-cover scale-110"
                />
                
                {/* Overlay shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
              </motion.div>

              {/* Floating Status Badge */}
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-16 right-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 shadow-xl z-20 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-0.5">Agent Sentinel</h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Surveillance Automatique</p>
                </div>
              </motion.div>

              {/* Top Left Floating Tech Badge */}
              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-20 left-12 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl py-2 px-4 shadow-xl z-20 flex items-center gap-2"
              >
                <Cpu className="h-4 w-4 text-fuchsia-400 dark:text-fuchsia-600" />
                <span className="text-xs font-bold font-mono tracking-wider">NEURAL LINK : OK</span>
              </motion.div>

            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
