// backend/src/routes/sections/marketplace.js
module.exports = function marketplaceSection(router) {
  // ============================
  // ADMIN MARKETPLACE
  // ============================
  try {
    router.use(
      "/admin/marketplace/categories",
      require("../admin/marketplace/categories")
    );
  } catch (e) {
    console.error(
      "Failed to mount /admin/marketplace/categories routes:",
      e?.message || e
    );
  }

  try {
    router.use(
      "/admin/marketplace/shops",
      require("../admin/marketplace/shops")
    );
  } catch (e) {
    console.error(
      "Failed to mount /admin/marketplace/shops routes:",
      e?.message || e
    );
  }

  try {
    router.use(
      "/admin/marketplace/products",
      require("../admin/marketplace/products")
    );
  } catch (e) {
    console.error(
      "Failed to mount /admin/marketplace/products routes:",
      e?.message || e
    );
  }

  try {
    router.use(
      "/admin/marketplace/promo-codes",
      require("../admin/marketplace/promo-codes")
    );
  } catch (e) {
    console.error(
      "Failed to mount /admin/marketplace/promo-codes routes:",
      e?.message || e
    );
  }

  // 🔹 NOUVELLE SECTION : commissions admin marketplace
  try {
    router.use(
      "/admin/marketplace/commissions",
      require("../admin/marketplace/commissions")
    );
  } catch (e) {
    console.error(
      "Failed to mount /admin/marketplace/commissions routes:",
      e?.message || e
    );
  }

  // ============================
  // MARKETPLACE PRIVÉ (UTILISATEUR CONNECTÉ)
  // ============================
  try {
    router.use("/marketplace/shops", require("../marketplace/shop"));
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/shops routes:",
      e?.message || e
    );
  }

  try {
    router.use("/marketplace/products", require("../marketplace/product"));
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/products routes:",
      e?.message || e
    );
  }

  try {
    router.use("/marketplace/profile", require("../marketplace/profile.sync"));
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/profile routes:",
      e?.message || e
    );
  }

  try {
    router.use(
      "/marketplace/profile/orders",
      require("../marketplace/profile.orders")
    );
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/profile/orders routes:",
      e?.message || e
    );
  }

  try {
    router.use(
      "/marketplace/profile/balance",
      require("../marketplace/profile.balance")
    );
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/profile/balance routes:",
      e?.message || e
    );
  }

  try {
    router.use(
      "/marketplace/profile/products",
      require("../marketplace/profile.products")
    );
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/profile/products routes:",
      e?.message || e
    );
  }

  try {
    router.use("/marketplace/categories", require("../marketplace/categories"));
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/categories routes:",
      e?.message || e
    );
  }

  // ============================
  // MARKETPLACE PUBLIC
  // ============================
  try {
    router.use(
      "/marketplace/public/shops",
      require("../marketplace/public.shops")
    );
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/public/shops routes:",
      e?.message || e
    );
  }

  try {
    router.use(
      "/marketplace/public/products",
      require("../marketplace/public.products")
    );
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/public/products routes:",
      e?.message || e
    );
  }

  try {
    router.use(
      "/marketplace/public/promos",
      require("../marketplace/public.promos")
    );
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/public/promos routes:",
      e?.message || e
    );
  }

  try {
    router.use(
      "/marketplace/public/categories",
      require("../marketplace/public.categories")
    );
  } catch (e) {
    console.error(
      "Failed to mount /marketplace/public/categories routes:",
      e?.message || e
    );
  }
};
