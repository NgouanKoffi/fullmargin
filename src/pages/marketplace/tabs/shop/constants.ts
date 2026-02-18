/** Limites de champs (inchangées) */
export const NAME_MAX = 30;
export const DESC_MAX = 200;
export const SIGN_MAX = 20;

/** Contraintes fichiers */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2 Mo
export const COVER_MAX_BYTES = 4 * 1024 * 1024; // 4 Mo
export const ACCEPT_IMAGES = "image/png,image/jpeg";

/** Styles utilitaires */
export const cardBase =
  "rounded-2xl border bg-white shadow-sm border-neutral-200 " +
  "dark:bg-black/30 dark:border-white/10 p-4 md:p-5";

export const inputBase =
  "w-full rounded-xl border px-4 py-3 " +
  "bg-white text-neutral-900 placeholder-neutral-500 border-neutral-300 " +
  "focus:outline-none focus:ring-2 focus:ring-violet-500/60 " +
  "dark:bg-neutral-900/60 dark:text-neutral-100 dark:placeholder-neutral-400 dark:border-white/10";
