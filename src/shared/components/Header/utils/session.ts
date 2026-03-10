export function getMyCommunitySlug(): string {
  try {
    return sessionStorage.getItem("fm:community:my-slug") || "";
  } catch {
    return "";
  }
}

export function hasShopFromSession(): boolean {
  try {
    return sessionStorage.getItem("fm:shop:exists") === "1";
  } catch {
    return false;
  }
}
