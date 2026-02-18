// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\communaute\public\components\feed\utils.ts
import type { Media, PostLite, CommentLite } from "./types";

/** Typage strict pour éviter le “string not assignable to 'image'|'video'” */
export const img = (url: string): Media => ({ type: "image", url });
export const vid = (url: string, thumbnail?: string): Media => ({
  type: "video",
  url,
  thumbnail,
});

export function wait(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function clampText(text: string, maxChars = 420) {
  const t = text.trim();
  if (t.length <= maxChars) return { short: t, long: "", clamped: false };
  const short = t.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
  return { short, long: t, clamped: true };
}

/** Mocks DEMO (toujours dispo pour d'autres écrans) */
export function makeMockPosts(offset: number, count = 6): PostLite[] {
  return Array.from({ length: count }).map((_, i) => {
    const idx = offset + i + 1;
    const idStr = String(idx);
    const r = idx % 6;

    const medias: Media[] | undefined =
      r === 0
        ? undefined
        : r === 1
        ? [img(`https://picsum.photos/seed/${idx}/1200/800`)]
        : r === 2
        ? [
            img(`https://picsum.photos/seed/${idx}-a/1200/800`),
            img(`https://picsum.photos/seed/${idx}-b/1200/800`),
          ]
        : r === 3
        ? [
            img(`https://picsum.photos/seed/${idx}-a/1200/800`),
            vid(
              "https://www.w3schools.com/html/mov_bbb.mp4",
              `https://picsum.photos/seed/thumb-${idx}/960/540`
            ),
          ]
        : r === 4
        ? [
            vid(
              "https://www.w3schools.com/html/mov_bbb.mp4",
              `https://picsum.photos/seed/thumb-${idx}/960/540`
            ),
            img(`https://picsum.photos/seed/${idx}-c/1200/800`),
          ]
        : [
            img(`https://picsum.photos/seed/${idx}-a/1200/800`),
            img(`https://picsum.photos/seed/${idx}-b/1200/800`),
            vid(
              "https://www.w3schools.com/html/mov_bbb.mp4",
              `https://picsum.photos/seed/thumb-${idx}/960/540`
            ),
          ];

    return {
      id: idStr,
      author: {
        name: `Membre ${idx}`,
        avatar: `https://i.pravatar.cc/80?img=${(idx % 70) + 1}`,
        isVerified: idx % 7 === 0,
      },
      createdAt: new Date(Date.now() - idx * 3600_000).toISOString(),
      content:
        idx % 2 === 0
          ? `Texte très long — ${"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(
              40
            )}\n\n` +
            `Suite et fin: ${"Proin ut ligula vel nunc egestas porttitor. ".repeat(
              30
            )}`
          : "Un post court et sympa 🚀",
      likes: Math.floor(Math.random() * 200),
      comments: Math.floor(Math.random() * 50),
      media: medias,
      access: idx % 9 === 0 ? "premium" : "public",
    };
  });
}

/** (toujours dispo si tu en as besoin ailleurs) */
export function makeMockComments(postId: string): CommentLite[] {
  const base = (seed: number): CommentLite => ({
    id: `${postId}-${seed}`,
    author: {
      name: `User ${seed}`,
      avatar: `https://i.pravatar.cc/64?img=${(seed % 70) + 1}`,
    },
    createdAt: new Date(Date.now() - seed * 2000_000).toISOString(),
    text:
      seed % 3 === 0
        ? "Super intéressant, merci pour le partage !"
        : "Je suis d'accord, on devrait creuser cette piste.",
  });
  return [
    {
      ...base(1),
      replies: [
        { ...base(11), text: "Bonne idée, je fais un doc et je reviens." },
        { ...base(12), text: "On peut faire un sondage." },
      ],
    },
    { ...base(2) },
    { ...base(3), replies: [{ ...base(31), text: "Merci ! 🙌" }] },
  ];
}
