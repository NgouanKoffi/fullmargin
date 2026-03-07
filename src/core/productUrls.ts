// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\lib\productUrls.ts
export function publicProductUrl(id: string) {
  // Ajuste si besoin: garde un chemin "public"
  return `${window.location.origin}/marketplace/public/product/${id}`;
}
