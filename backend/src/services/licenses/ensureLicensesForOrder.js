// backend/src/services/licenses/ensureLicensesForOrder.js
const License = require("../../models/license.model");
const Order = require("../../models/order.model");
const Product = require("../../models/product.model");
const User = require("../../models/user.model");
const ProfileExtra = require("../../models/profileExtra.model");

const { issueLicense, renewLicense } = require("./secureLicenses.client");
const {
  buildIssuePayload,
  buildRenewPayload,
} = require("./licensePayload.builder");

const {
  sendLicenseIssuedEmail,
  sendLicenseRenewedEmail,
} = require("../../utils/mailer");

const LICENSEABLE_TYPES = new Set(["robot_trading", "indicator", "mt4_mt5"]);

/* =========================================================
   ✅ Helpers: robust productId extraction (Stripe + Crypto)
========================================================= */

function pickId(v) {
  if (!v) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "object") {
    const a = v._id || v.id || v.productId || v.product_id;
    if (typeof a === "string") return a.trim();
    if (a && typeof a === "object") {
      const b = a._id || a.id;
      if (typeof b === "string") return b.trim();
      return b ? String(b).trim() : "";
    }
    return a ? String(a).trim() : "";
  }
  return String(v).trim();
}

function getItemProductId(item) {
  const p1 = pickId(item?.product);
  if (p1) return p1;
  const p2 = pickId(item?.productId);
  if (p2) return p2;
  const p3 = pickId(item?.product_id);
  if (p3) return p3;
  const p4 = pickId(item?.product?._id || item?.product?.id);
  if (p4) return p4;
  return "";
}

function requireFields(payload) {
  const missing = [];
  if (!payload?.nom) missing.push("nom");
  if (!payload?.prenom) missing.push("prenom");
  if (!payload?.telephone) missing.push("telephone");
  if (missing.length) {
    const err = new Error(
      `Missing required user fields for license: ${missing.join(", ")}`,
    );
    err.code = "LICENSE_USER_FIELDS_MISSING";
    err.missing = missing;
    throw err;
  }
}

function pickLicenseKey(resp) {
  return (
    resp?.license_key ||
    resp?.licenseKey ||
    resp?.data?.license_key ||
    resp?.data?.licenseKey ||
    ""
  );
}

function pickExpiresAt(resp) {
  const raw =
    resp?.expires_at ||
    resp?.expiresAt ||
    resp?.data?.expires_at ||
    resp?.data?.expiresAt ||
    null;

  if (!raw) return null;
  try {
    const d = new Date(raw);
    return Number.isFinite(d.getTime()) ? d : null;
  } catch {
    return null;
  }
}

function isProviderSuccess(resp) {
  if (typeof resp?.ok === "boolean") return resp.ok === true;
  if (typeof resp?.success === "boolean") return resp.success === true;
  return !!pickLicenseKey(resp);
}

function isRenewProviderSuccess(resp) {
  if (typeof resp?.ok === "boolean") return resp.ok === true;
  if (typeof resp?.success === "boolean") return resp.success === true;
  if (pickExpiresAt(resp)) return true;
  if (resp?.renewed === true) return true;
  return false;
}

function addDuration(baseDate, duration, unit) {
  const d = new Date(baseDate);
  if (!Number.isFinite(d.getTime())) return null;
  const dur = Number(duration);
  if (!Number.isFinite(dur) || dur <= 0) return d;
  const u = String(unit || "")
    .toLowerCase()
    .trim();
  if (u === "days") {
    d.setDate(d.getDate() + dur);
    return d;
  }
  if (u === "years") {
    d.setFullYear(d.getFullYear() + dur);
    return d;
  }
  d.setMonth(d.getMonth() + dur);
  return d;
}

async function findLatestIssuedLicenseKey({ userId, productId }) {
  const doc = await License.findOne({
    user: userId,
    product: productId,
    status: "issued",
    licenseKey: { $exists: true, $ne: "" },
  })
    .sort({ createdAt: -1, _id: -1 })
    .lean();
  return doc || null;
}

// ✅ REFACTOR: Retourne true si une licence a été générée, false sinon
async function ensureLicensesForOrder(orderId) {
  const order = await Order.findById(orderId).lean();
  if (!order || order.status !== "succeeded") return false;

  const user = await User.findById(order.user).lean();
  if (!user) return false;

  const profileExtra = await ProfileExtra.findOne({ user: order.user }).lean();
  const phoneRaw = String(profileExtra?.phone || "").trim();
  const phone = phoneRaw ? phoneRaw : "22";

  let anyLicenseGenerated = false;

  for (const item of order.items || []) {
    const productId = getItemProductId(item);
    if (!productId) {
      console.warn("[LICENSE] skip item: missing product id", {
        orderId: String(order._id),
      });
      continue;
    }

    const exists = await License.findOne({
      order: order._id,
      product: productId,
    }).lean();
    if (exists) {
      anyLicenseGenerated = true;
      continue;
    }

    const product = await Product.findById(productId).lean();
    if (!product) continue;

    if (!LICENSEABLE_TYPES.has(product.type)) continue;

    // ✅ CONDITION CRITIQUE AJOUTÉE :
    // On ne génère une licence QUE si c'est un abonnement OU si le produit a explicitement `hasLicense: true`
    const isSubscription = product?.pricing?.mode === "subscription";
    const explicitLicense = product.hasLicense === true;

    if (!isSubscription && !explicitLicense) {
      console.log(
        `[LICENSE] Ignoré pour ${productId} (Pas d'abonnement et pas de flag hasLicense)`,
      );
      continue;
    }

    const isLifetime = product?.pricing?.mode === "one_time";

    try {
      const issuePayload = buildIssuePayload({
        user,
        product,
        profileExtra,
        phone,
      });

      const prev = await findLatestIssuedLicenseKey({
        userId: order.user,
        productId: product._id,
      });

      const hasPrevKey = !!String(prev?.licenseKey || "").trim();

      // RENOUVELLEMENT
      if (isSubscription && hasPrevKey) {
        const renewPayload = buildRenewPayload({
          licenseKey: prev.licenseKey,
          duration: issuePayload.duration,
          unit: issuePayload.unit,
          reactivate: true,
        });

        const resp = await renewLicense(renewPayload);

        if (!isRenewProviderSuccess(resp)) {
          throw new Error(
            typeof resp === "string" ? resp : JSON.stringify(resp),
          );
        }

        let expiresAt = isLifetime ? null : pickExpiresAt(resp);
        if (!isLifetime && !expiresAt) {
          const base = prev?.expiresAt ? new Date(prev.expiresAt) : new Date();
          const safeBase =
            base && Number.isFinite(base.getTime()) ? base : new Date();
          expiresAt = addDuration(
            safeBase,
            issuePayload.duration,
            issuePayload.unit,
          );
        }

        const doc = await License.create({
          user: order.user,
          order: order._id,
          product: product._id,
          seller: item.seller,
          shop: item.shop || null,
          provider: "secure.fullmargin.net",
          keyType: issuePayload.key_type || "robot",
          robotName: issuePayload.robot_name || product.title || "",
          licenseKey: String(prev.licenseKey || "").trim(),
          expiresAt,
          status: "issued",
        });

        await sendLicenseRenewedEmail({
          to: user.email,
          fullName: user.fullName || "",
          productTitle: product.title || "",
          licenseKey: doc.licenseKey,
          expiresAt: doc.expiresAt,
          isLifetime,
        }).catch((e) => console.error("[MAIL] license renewed failed:", e));

        anyLicenseGenerated = true;
        continue;
      }

      // ISSUE
      requireFields(issuePayload);
      const resp = await issueLicense(issuePayload);

      if (!isProviderSuccess(resp) || !pickLicenseKey(resp)) {
        throw new Error(typeof resp === "string" ? resp : JSON.stringify(resp));
      }

      const licenseKey = pickLicenseKey(resp);
      const expiresAt = isLifetime ? null : pickExpiresAt(resp);

      const doc = await License.create({
        user: order.user,
        order: order._id,
        product: product._id,
        seller: item.seller,
        shop: item.shop || null,
        provider: "secure.fullmargin.net",
        keyType: issuePayload.key_type || "robot",
        robotName: issuePayload.robot_name || product.title || "",
        licenseKey,
        expiresAt,
        status: "issued",
      });

      await sendLicenseIssuedEmail({
        to: user.email,
        fullName: user.fullName || "",
        productTitle: product.title || "",
        licenseKey: doc.licenseKey,
        expiresAt: doc.expiresAt,
        isLifetime,
      }).catch((e) => console.error("[MAIL] license issued failed:", e));

      anyLicenseGenerated = true;
    } catch (e) {
      console.error("[LICENSE] Error:", e);
      await License.create({
        user: order.user,
        order: order._id,
        product: productId,
        seller: item.seller,
        shop: item.shop || null,
        status: "failed",
        lastError: e?.message || String(e),
      }).catch(() => null);
    }
  }

  return anyLicenseGenerated;
}

module.exports = { ensureLicensesForOrder };
