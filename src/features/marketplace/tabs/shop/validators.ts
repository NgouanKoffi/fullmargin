// C:\Users\ADMIN\Desktop\fullmargin-site\src\pages\marketplace\tabs\shop\validators.ts
import {
  NAME_MAX,
  DESC_MAX,
  SIGN_MAX,
  AVATAR_MAX_BYTES,
  COVER_MAX_BYTES,
} from "./constants";

export const validateName = (v: string) =>
  v.trim().length > 0 && v.trim().length <= NAME_MAX;

export const validateDesc = (v: string) =>
  v.trim().length > 0 && v.trim().length <= DESC_MAX;

export const validateSignature = (v: string) =>
  v.trim().length > 0 && v.trim().length <= SIGN_MAX;

export const validateSizeAvatar = (size: number) => size <= AVATAR_MAX_BYTES;
export const validateSizeCover = (size: number) => size <= COVER_MAX_BYTES;

export const isDraftComplete = (d: {
  name: string;
  desc: string;
  signature: string;
  avatarDataUrl?: string | null;
  coverDataUrl?: string | null;
}) =>
  validateName(d.name) &&
  validateDesc(d.desc) &&
  validateSignature(d.signature) &&
  !!d.avatarDataUrl &&
  !!d.coverDataUrl;
