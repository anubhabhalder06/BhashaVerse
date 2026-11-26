// @ts-check

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Create an HTML element safely without innerHTML.
 * @param {string} tag
 * @param {Record<string, unknown>} [attrs]
 * @param {...(Node | string | null | undefined | false)} children
 * @returns {HTMLElement}
 */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") {
      node.className = String(v);
    } else if (k === "dataset" && typeof v === "object") {
      for (const [dk, dv] of Object.entries(/** @type {Record<string, string>} */ (v))) {
        if (dv !== undefined && dv !== null) node.dataset[dk] = String(dv);
      }
    } else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), /** @type {EventListener} */ (v));
    } else if (v === true) {
      node.setAttribute(k, "");
    } else {
      node.setAttribute(k, String(v));
    }
  }
  appendChildren(node, children);
  return node;
}

/**
 * Create a DOM Text node.
 * @param {unknown} value
 * @returns {Text}
 */
export function text(value) {
  return document.createTextNode(value == null ? "" : String(value));
}

/**
 * Remove all child nodes safely.
 * @param {Element} parent
 */
export function clear(parent) {
  while (parent.firstChild) parent.removeChild(parent.firstChild);
}

/**
 * Append mixed nodes/strings recursively.
 * @param {Element} parent
 * @param {unknown[]} children
 */
export function appendChildren(parent, children) {
  for (const ch of children) {
    if (ch === null || ch === undefined || ch === false) continue;
    if (Array.isArray(ch)) {
      appendChildren(parent, ch);
    } else if (ch instanceof Node) {
      parent.appendChild(ch);
    } else {
      parent.appendChild(document.createTextNode(String(ch)));
    }
  }
}

/**
 * Build a minimal stroke SVG icon in Matrika's hairline aesthetic.
 * @param {number} width
 * @param {number} height
 * @param {Array<[string, Record<string, string>]>} shapes
 * @returns {SVGSVGElement}
 */
export function svgIcon(width, height, shapes) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.75");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  for (const [shapeTag, attrs] of shapes) {
    const s = document.createElementNS(SVG_NS, shapeTag);
    for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
    svg.appendChild(s);
  }
  return svg;
}

/** @returns {SVGSVGElement} */
export function iconPlayCircle() {
  return svgIcon(22, 22, [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["polygon", { points: "10 8 16 12 10 16 10 8" }],
  ]);
}

/** @returns {SVGSVGElement} */
export function iconPauseCircle() {
  return svgIcon(22, 22, [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "10", y1: "8", x2: "10", y2: "16" }],
    ["line", { x1: "14", y1: "8", x2: "14", y2: "16" }],
  ]);
}

/**
 * Build a responsive <picture> with AVIF/WebP 640w + full srcset when available.
 * @param {string} src
 * @param {string} alt
 * @param {{
 *   class?: string,
 *   pictureClass?: string,
 *   width?: number | string,
 *   height?: number | string,
 *   sizes?: string,
 *   loading?: "lazy" | "eager",
 *   decoding?: "async" | "sync" | "auto",
 *   fetchpriority?: "high" | "low" | "auto",
 *   draggable?: boolean
 * }} [opts]
 * @returns {HTMLElement}
 */
export function pictureEl(src, alt, opts = {}) {
  const isLocalRaster = typeof src === "string" && /(^|\/)assets\/images\/.+\.(jpg|jpeg|png)$/i.test(src);
  const sizes = opts.sizes || "(max-width: 768px) 100vw, 50vw";
  const img = el("img", {
    src,
    alt: alt || "",
    class: opts.class || "",
    width: opts.width,
    height: opts.height,
    sizes: isLocalRaster ? sizes : undefined,
    loading: opts.loading || "lazy",
    decoding: opts.decoding || "async",
    fetchpriority: opts.fetchpriority,
    draggable: opts.draggable === false ? "false" : undefined,
  });

  if (!isLocalRaster) {
    return el("picture", { class: opts.pictureClass || "" }, img);
  }

  const base = src.replace(/\.(jpg|jpeg|png)$/i, "");
  return el(
    "picture",
    { class: opts.pictureClass || "" },
    el("source", {
      type: "image/avif",
      srcset: `${base}-640.avif 640w, ${base}.avif 1400w`,
      sizes,
    }),
    el("source", {
      type: "image/webp",
      srcset: `${base}-640.webp 640w, ${base}.webp 1400w`,
      sizes,
    }),
    img,
  );
}

/**
 * Render category hairline icon by key.
 * @param {string} key
 * @returns {SVGSVGElement}
 */
export function iconCategory(key) {
  /** @type {Record<string, Array<[string, Record<string, string>]>>} */
  const map = {
    word: [["path", { d: "M5 7h14M5 12h10M5 17h7M17 14v6M14 17h6" }]],
    song: [["circle", { cx: "8", cy: "17", r: "3" }], ["path", { d: "M11 17V6l8-2v9" }], ["circle", { cx: "16", cy: "15", r: "3" }]],
    story: [["path", { d: "M4 6h16v10H9l-5 4V6z" }], ["path", { d: "M9 10h6M9 13h4" }]],
    manuscript: [["rect", { x: "4", y: "6", width: "16", height: "12", rx: "2" }], ["circle", { cx: "8", cy: "12", r: "1" }], ["circle", { cx: "16", cy: "12", r: "1" }], ["path", { d: "M10 10h4M10 14h4" }]],
    photograph: [["rect", { x: "3", y: "5", width: "18", height: "14", rx: "4" }], ["circle", { cx: "12", cy: "12", r: "3.5" }]],
    place: [["path", { d: "M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" }], ["circle", { cx: "12", cy: "11", r: "2" }]],
  };
  return svgIcon(30, 30, map[key] || map.word);
}
