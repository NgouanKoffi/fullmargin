// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\podcasts\utils.ts
export const cx = (...xs: Array<string | false | null | undefined>) =>
  xs.filter((x): x is string => Boolean(x)).join(" ");

export const fmtTime = (sec: number) => {
  const m = Math.floor(sec / 60).toString();
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};
