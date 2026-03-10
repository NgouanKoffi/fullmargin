import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function FinalCTA() {
    const improvements = [
        "Journal de trading & métriques pro",
        "Analyses avancées par IA",
        "Communautés vérifiées & Copy Trading",
        "Outils de Backtesting & Replay",
    ];

    const handlePrimary = () => {
        const w = typeof window !== "undefined" ? window.innerWidth : 0;
        if (w < 1170) {
            window.dispatchEvent(new Event("fm:open-launcher"));
        } else {
            window.dispatchEvent(new Event("fm:open-account-dock"));
        }
    };

    return (
        <div className="w-full relative py-12 sm:py-16 overflow-hidden">
            {/* Background with abstract glow */}
            <div className="absolute inset-0 bg-transparent z-0" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-fm-primary/5 dark:bg-fm-primary/10 blur-[100px] rounded-[100%] z-0 pointer-events-none" />

            <div className="max-w-[1000px] mx-auto px-4 sm:px-6 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    animate={{ y: [0, -10, 0] }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{
                        duration: 0.7,
                        ease: "easeOut",
                        y: {
                            duration: 5,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }
                    }}
                    className="bg-white dark:bg-[#0A0C18]/80 border border-skin-border/20 dark:border-white/10 rounded-[32px] p-6 sm:p-10 lg:p-12 backdrop-blur-xl shadow-xl overflow-hidden relative"
                >
                    {/* Subtle top border glow */}
                    <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-fm-primary/50 to-transparent" />

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-skin-base dark:text-white mb-6 tracking-tight leading-[1.2]">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-fm-primary to-[#A855F7] dark:from-[#A855F7] dark:to-[#D946EF]">
                            Le trading est bien meilleur
                        </span>
                        <br className="hidden sm:block" />
                        <span className="sm:inline hidden"> </span>avec votre écosystème FULL MARGIN
                    </h2>

                    <div className="max-w-2xl mx-auto flex flex-col md:flex-row flex-wrap justify-center gap-3 sm:gap-4 mb-10">
                        {improvements.map((item, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.1 * idx }}
                                className="flex items-center gap-2 text-skin-muted dark:text-slate-300 bg-slate-50 dark:bg-[#0B0F14]/50 rounded-full px-4 py-2 sm:px-5 sm:py-2.5 border border-skin-border/20 dark:border-white/5 shadow-sm"
                            >
                                <CheckCircle2 className="w-4 h-4 text-fm-primary dark:text-[#D946EF]" />
                                <span className="text-[13px] sm:text-sm font-semibold">{item}</span>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <button
                            onClick={handlePrimary}
                            className="group inline-flex items-center justify-center gap-2 rounded-full bg-fm-primary text-white hover:bg-black dark:hover:bg-white dark:hover:text-fm-primary px-8 py-3.5 text-base font-bold shadow-[0_8px_32px_rgba(111,60,255,0.4)] hover:shadow-[0_12px_40px_rgba(111,60,255,0.6)] transition-all duration-300 hover:-translate-y-1"
                        >
                            Propulser ma réussite
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                        <p className="mt-4 text-[13px] font-medium text-skin-muted dark:text-slate-400">
                            Prenez le contrôle de vos investissements en un seul endroit.
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
