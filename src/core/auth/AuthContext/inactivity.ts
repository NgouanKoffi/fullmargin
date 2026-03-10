// src/auth/AuthContext/inactivity.ts

// 7 jours d'inactivité avant déconnexion (quasi "reste connecté")
export const INACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;

export const WINDOW_ACTIVITY_EVENTS: ReadonlyArray<keyof WindowEventMap> = [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "scroll",
  "touchstart",
  "focus",
];

export const DOC_ACTIVITY_EVENTS: ReadonlyArray<keyof DocumentEventMap> = [
  "visibilitychange",
];
