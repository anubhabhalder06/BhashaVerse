// @ts-check

/** @readonly */
export const RIGHTS_STATUS = Object.freeze({
  PUBLIC_DOMAIN: "public-domain",
  OPEN_LICENCE: "open-licence",
  PERMISSION_GRANTED: "permission-granted",
  RESTRICTED: "restricted",
  METADATA_ONLY: "metadata-only",
});

/** @readonly */
export const RIGHTS_ACCESS = Object.freeze({
  OPEN: "open",
  VIEW_ONLY: "view-only",
  ON_REQUEST: "on-request",
  NONE: "none",
});

/** @readonly */
export const VERIFICATION_STATUS = Object.freeze({
  VERIFIED: "verified",
  ORAL_ACCOUNT: "oral-account",
  INTERPRETATION: "interpretation",
  UNVERIFIED: "unverified",
  DEMO: "demo",
});

/** @readonly */
export const CONTRIBUTION_STATUS = Object.freeze({
  PENDING: "pending",
  NEEDS_CLARIFICATION: "needs clarification",
  APPROVED: "approved",
  RESTRICTED: "restricted",
  REJECTED: "rejected",
});

/** @readonly */
export const WORDMARK_STATUS = Object.freeze({
  OFFICIAL: "official",
  DEMO_UNVERIFIED: "demo-unverified",
  PENDING: "pending",
});
