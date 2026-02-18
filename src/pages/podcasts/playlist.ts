// src/pages/podcasts/playlist.ts
import {
  getPublicPlaylistIds,
  addPublicPlaylistItem,
  removePublicPlaylistItem,
} from "./publicApi";

// état uniquement en mémoire
let mem = new Set<string>();

// abonnés (sidebar, pages…)
const listeners = new Set<(count: number) => void>();

function notify() {
  const count = mem.size;
  listeners.forEach((fn) => fn(count));
}

// au chargement, on essaie de récupérer la playlist distante
(async () => {
  try {
    const remoteIds = await getPublicPlaylistIds();
    mem = new Set(remoteIds.map(String));
    notify();
  } catch (err) {
    // err est de type inconnu, on le log seulement si c’est pas un 404
    if (isNotFoundError(err)) {
      // on ne dit rien, la route n’est pas encore prête
      return;
    }
    // autres erreurs -> on log
    console.warn("[playlist] failed to fetch remote playlist:", err);
  }
})();

// petit helper de narrowing
function isNotFoundError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  // selon ton api.ts, ça peut être { status: 404 } ou { statusCode: 404 }
  const maybeStatus = (err as { status?: number }).status;
  const maybeStatusCode = (err as { statusCode?: number }).statusCode;
  return maybeStatus === 404 || maybeStatusCode === 404;
}

export const playlist = {
  has(id: string) {
    return mem.has(String(id));
  },

  list() {
    return [...mem];
  },

  size() {
    return mem.size;
  },

  async add(id: string) {
    const sid = String(id);
    // on appelle d’abord l’API
    await addPublicPlaylistItem(sid);
    // si ça a marché, on met à jour le cache mémoire
    mem.add(sid);
    notify();
    return true;
  },

  async remove(id: string) {
    const sid = String(id);
    await removePublicPlaylistItem(sid);
    const had = mem.delete(sid);
    if (had) {
      notify();
    }
    return had;
  },

  async toggle(id: string) {
    const sid = String(id);
    if (mem.has(sid)) {
      await this.remove(sid);
      return false;
    } else {
      await this.add(sid);
      return true;
    }
  },

  subscribe(fn: (count: number) => void) {
    listeners.add(fn);
    // valeur immédiate
    fn(mem.size);
    return () => {
      listeners.delete(fn);
    };
  },

  _reset() {
    mem = new Set();
    notify();
  },
};
