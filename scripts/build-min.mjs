// @ts-check
import fs from "node:fs";
import path from "node:path";

/**
 * Optional static CSS/JS minifier producing a self-contained dist/ folder
 * while keeping the repository 100% playable without a build step.
 */
const ROOT = process.cwd();
const OUT = path.join(ROOT, "dist");

function minifyCss(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function minifyJsComments(src) {
  return src
    .replace(/^\s*\/\/(?!\s*@ts-).*$/gm, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function walkAndCopy(relDir) {
  const srcDir = path.join(ROOT, relDir);
  const dstDir = path.join(OUT, relDir);
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(dstDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const sPath = path.join(srcDir, entry.name);
    const dPath = path.join(dstDir, entry.name);
    if (entry.isDirectory()) {
      walkAndCopy(path.join(relDir, entry.name));
    } else if (entry.name.endsWith(".css")) {
      fs.writeFileSync(dPath, minifyCss(fs.readFileSync(sPath, "utf8")));
    } else if (entry.name.endsWith(".js")) {
      fs.writeFileSync(dPath, minifyJsComments(fs.readFileSync(sPath, "utf8")));
    } else {
      fs.copyFileSync(sPath, dPath);
    }
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

for (const name of fs.readdirSync(ROOT)) {
  if (name.endsWith(".html") || ["sw.js", "robots.txt", "sitemap.xml", ".nojekyll"].includes(name)) {
    fs.copyFileSync(path.join(ROOT, name), path.join(OUT, name));
  }
}

walkAndCopy("css");
walkAndCopy("js");
walkAndCopy("data");
walkAndCopy("assets");

console.log("Built minified static snapshot at", OUT);
