// @ts-check
import { RIGHTS_ACCESS, RIGHTS_STATUS } from "../models/enums.js";

/**
 * Pure policy evaluator mapping archive record rights to UI preview/download rules.
 * Every component displaying files or download actions delegates to RightsPolicy.
 */
export class RightsPolicy {
  /**
   * Evaluate record rights.
   * @param {Record<string, any>} record
   * @returns {{ canPreview: boolean, canDownload: boolean, label: string, explanation: string }}
   */
  evaluate(record) {
    const rights = (record && record.rights) || {};
    const status = String(rights.status || RIGHTS_STATUS.METADATA_ONLY);
    const access = String(rights.access || RIGHTS_ACCESS.NONE);
    const licence = String(rights.licence || "");

    switch (status) {
      case RIGHTS_STATUS.PUBLIC_DOMAIN:
        return {
          canPreview: true,
          canDownload: true,
          label: "Public domain",
          explanation: "Public domain work; in-browser viewing and download are permitted with archival citation.",
        };
      case RIGHTS_STATUS.OPEN_LICENCE:
        return {
          canPreview: true,
          canDownload: true,
          label: licence ? `Openly licensed (${licence})` : "Openly licensed",
          explanation: "Openly licensed material; viewing and download are allowed with required creator attribution.",
        };
      case RIGHTS_STATUS.PERMISSION_GRANTED: {
        const allowDl = access === RIGHTS_ACCESS.OPEN;
        return {
          canPreview: access !== RIGHTS_ACCESS.NONE,
          canDownload: allowDl,
          label: "Permission granted",
          explanation: allowDl
            ? "Permission granted by rights holder for viewing and archival download."
            : "Permission granted for in-archive viewing only; downloads remain disabled per contributor terms.",
        };
      }
      case RIGHTS_STATUS.RESTRICTED:
        return {
          canPreview: access !== RIGHTS_ACCESS.NONE,
          canDownload: false,
          label: "Restricted",
          explanation: "Restricted material: download is disabled pending community custodian consent.",
        };
      case RIGHTS_STATUS.METADATA_ONLY:
      default:
        return {
          canPreview: false,
          canDownload: false,
          label: "Metadata only",
          explanation: "Catalogue metadata only; no file preview or download is available without cleared rights.",
        };
    }
  }
}
