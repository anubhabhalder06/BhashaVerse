// @ts-check

/** Immutable value object representing a single header wordmark frame grouped by ISO 15924 script. */
export class WordmarkFrame {
  /**
   * @param {{
   *   script: string,
   *   text: string,
   *   lang: string,
   *   font: string,
   *   status: string,
   *   captionLanguages: Array<{ id: string, name: string, nativeName: string }>,
   *   captionText: string,
   *   isAnchor?: boolean
   * }} props
   */
  constructor(props) {
    this.script = String(props.script);
    this.text = String(props.text);
    this.lang = String(props.lang);
    this.font = String(props.font);
    this.status = String(props.status);
    this.captionLanguages = Object.freeze((props.captionLanguages || []).map((l) => Object.freeze({ ...l })));
    this.captionText = String(props.captionText || "");
    this.isAnchor = Boolean(props.isAnchor);
    Object.freeze(this);
  }
}
