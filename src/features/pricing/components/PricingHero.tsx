import { motion } from "framer-motion";

export function PricingHero() {
  return (
    <section className="text-center px-6 py-16 sm:py-20">
      <motion.h1
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="text-4xl md:text-5xl font-extrabold tracking-tight"
      >
        Des tarifs{" "}
        <span className="text-indigo-500 dark:text-indigo-400">clairs</span> et{" "}
        <span className="text-indigo-500 dark:text-indigo-400">flexibles</span>
      </motion.h1>
      <motion.p
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className="mt-4 max-w-2xl mx-auto text-lg text-slate-600 dark:text-gray-400"
      >
        Choisissez le plan qui correspond à vos ambitions. <br />
        Passez au niveau supérieur sans surprise.
      </motion.p>
    </section>
  );
}
