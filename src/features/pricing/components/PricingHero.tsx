import { motion } from "framer-motion";

export function PricingHero() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const item = {
    hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
    show: { opacity: 1, filter: "blur(0px)", y: 0, transition: { duration: 0.8 } }
  };

  return (
    <section className="text-center px-6 py-16 sm:py-24 relative z-10">
      <motion.h1
        variants={container}
        initial="hidden"
        animate="show"
        className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-skin-base leading-tight md:leading-tight"
      >
        <motion.span variants={item} className="inline-block mr-2">Des</motion.span>
        <motion.span variants={item} className="inline-block mr-2">tarifs</motion.span>
        <motion.span variants={item} className="inline-block relative">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-fm-primary to-[#A855F7] dark:from-[#A855F7] dark:to-[#D946EF] px-2 -mx-2">
            clairs
          </span>
        </motion.span>
        <motion.span variants={item} className="inline-block mx-2">et</motion.span>
        <motion.span variants={item} className="inline-block relative">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#A855F7] to-[#D946EF] dark:from-[#D946EF] dark:to-[#F472B6] px-2 -mx-2">
            flexibles
          </span>
        </motion.span>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-skin-muted"
      >
        Choisissez le plan qui correspond à vos ambitions. <br />
        Passez au niveau supérieur sans surprise.
      </motion.p>
    </section>
  );
}
