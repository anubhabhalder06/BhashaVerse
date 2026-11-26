// @ts-check
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { RightsPolicy } from "../js/services/RightsPolicy.js";
import { SearchService } from "../js/services/SearchService.js";
import { FilterService } from "../js/services/FilterService.js";
import { IntentMatcher } from "../js/chat/IntentMatcher.js";
import { DataSource } from "../js/data/DataSource.js";
import { LanguageRepository } from "../js/data/LanguageRepository.js";
import { WordmarkRepository } from "../js/data/WordmarkRepository.js";
import { LocalContributionStore } from "../js/data/LocalContributionStore.js";
import { NavigationProgress } from "../js/components/NavigationProgress.js";
import { SafeStorage } from "../js/utils/storage.js";
import { CONTRIBUTION_STATUS } from "../js/models/enums.js";

const ROOT = process.cwd();

class NodeFileDataSource extends DataSource {
  load(name) {
    const clean = name.replace(/\.json$/, "");
    const raw = fs.readFileSync(path.join(ROOT, "data", `${clean}.json`), "utf8");
    return Promise.resolve(JSON.parse(raw));
  }
}

test("RightsPolicy evaluates every status accurately", () => {
  const policy = new RightsPolicy();

  const pd = policy.evaluate({ rights: { status: "public-domain", access: "open" } });
  assert.equal(pd.canPreview, true);
  assert.equal(pd.canDownload, true);

  const ol = policy.evaluate({ rights: { status: "open-licence", licence: "CC BY 2.5", access: "open" } });
  assert.equal(ol.canPreview, true);
  assert.equal(ol.canDownload, true);
  assert.match(ol.label, /CC BY 2\.5/);

  const pgView = policy.evaluate({ rights: { status: "permission-granted", access: "view-only" } });
  assert.equal(pgView.canPreview, true);
  assert.equal(pgView.canDownload, false);

  const pgOpen = policy.evaluate({ rights: { status: "permission-granted", access: "open" } });
  assert.equal(pgOpen.canPreview, true);
  assert.equal(pgOpen.canDownload, true);

  const res = policy.evaluate({ rights: { status: "restricted", access: "on-request" } });
  assert.equal(res.canDownload, false);

  const meta = policy.evaluate({ rights: { status: "metadata-only", access: "none" } });
  assert.equal(meta.canPreview, false);
  assert.equal(meta.canDownload, false);
});

test("SearchService handles ranking, grouping, Unicode scripts, Latin diacritics, and typos", async () => {
  const ds = new NodeFileDataSource();
  const langRepo = new LanguageRepository(ds);
  const [languages, resources, media, audio, stories] = await Promise.all([
    langRepo.list(),
    ds.load("resources"),
    ds.load("media"),
    ds.load("audio"),
    ds.load("stories"),
  ]);

  const search = new SearchService({ languages, resources, media, audio, stories });

  const santaliRes = search.search("ᱥᱟᱱᱛᱟᱲᱤ");
  assert.ok(santaliRes.groups.languages.length >= 1);
  assert.equal(santaliRes.groups.languages[0].id, "santali");

  // Latin diacritic query (nīr vs nir)
  const nirRes = search.search("nir");
  assert.ok(nirRes.groups.languages.some((l) => l.id === "tulu"));

  // Simple Latin typo tolerance ("Santli" -> Santali)
  const typoRes = search.search("Santli");
  assert.ok(typoRes.groups.languages.some((l) => l.id === "santali"));

  // Never returns unrelated filler when nothing matches
  const noneRes = search.search("xyzqwertyimpossible");
  assert.equal(noneRes.total, 0);
});

test("FilterService extracts sorted facets and filters records accurately", async () => {
  const ds = new NodeFileDataSource();
  const langs = await new LanguageRepository(ds).list();
  const fsSvc = new FilterService();

  const families = fsSvc.extractFacets(langs, (l) => l.family);
  assert.ok(families.includes("Dravidian"));
  assert.ok(families.includes("Austroasiatic"));

  const dravidian = fsSvc.filter(
    langs,
    { query: "", facets: { family: "Dravidian" } },
    { searchText: (l) => l.name, getters: { family: (l) => l.family } }
  );
  assert.ok(dravidian.length >= 3);
  assert.ok(dravidian.every((l) => l.family === "Dravidian"));
});

test("IntentMatcher routes sample chatbot questions to expected intents", async () => {
  const ds = new NodeFileDataSource();
  const kb = await ds.load("chat/knowledge");
  const matcher = new IntentMatcher();

  const cases = [
    ["how do i contribute", "contribute"],
    ["what does public domain mean here?", "rights_public_domain"],
    ["show the map please", "nav_map"],
    ["take me to the audio archive", "nav_audio"],
    ["tell me something completely unknown zzz", "fallback"],
  ];

  for (const [q, expected] of cases) {
    const hit = matcher.match(q, kb.intents, kb.confidenceThreshold);
    assert.equal(hit.intentId, expected, `Expected "${q}" -> ${expected}, got ${hit.intentId}`);
  }
});

test("WordmarkRepository puts anchors first, groups by script, and skips null text", async () => {
  const ds = new NodeFileDataSource();
  const langRepo = new LanguageRepository(ds);
  const wmRepo = new WordmarkRepository(ds, langRepo);
  const frames = await wmRepo.getFrames();

  assert.equal(frames[0].script, "Latn");
  assert.equal(frames[1].script, "Deva");
  // Null-text scripts like Lepc/Mtei/Wara/Toto must be skipped cleanly
  assert.equal(frames.some((f) => f.script === "Lepc"), false);
  assert.equal(frames.some((f) => f.text === null || f.text === ""), false);
  // Caption formatting check for Orya (shared by Sora & Kui)
  const orya = frames.find((f) => f.script === "Orya");
  assert.ok(orya);
  assert.match(orya.captionText, /Sora/);
  assert.match(orya.captionText, /Kui/);
});

test("LocalContributionStore stores pending entries safely with memory fallback", () => {
  const store = new LocalContributionStore(new SafeStorage(null));
  const created = store.add({
    type: "Text or story",
    title: "Test Mishing proverb",
    description: "Demo entry",
    language: "Mishing",
    rightsConfirmed: true,
    consentConfirmed: true,
  });

  assert.equal(created.status, CONTRIBUTION_STATUS.PENDING);
  assert.equal(store.list().length, 1);

  const updated = store.updateStatus(created.id, CONTRIBUTION_STATUS.APPROVED);
  assert.equal(updated?.status, CONTRIBUTION_STATUS.APPROVED);
  assert.equal(store.list()[0].status, CONTRIBUTION_STATUS.APPROVED);
});

test("NavigationProgress delays 150ms, sets flag, finishes on next load, and resets on persisted pageshow", () => {
  const timers = new Map();
  let nextId = 1;
  const scheduler = {
    setTimeout: (fn, ms) => {
      const id = nextId++;
      timers.set(id, { fn, ms });
      return id;
    },
    clearTimeout: (id) => {
      timers.delete(id);
    },
  };
  const mem = new Map();
  const storage = {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: (k) => mem.delete(k),
  };

  // Fast action finishes < 150ms: bar never shows and no storage flag is written
  const npFast = new NavigationProgress({ scheduler, storage, document: null, window: null });
  npFast.start({ forNavigation: true });
  assert.equal(npFast.visible, false);
  assert.equal(storage.getItem("matrika:nav-pending"), null);
  npFast.done();
  assert.equal(npFast.visible, false);
  assert.equal(timers.size, 0);

  // Slow navigation triggers after 150ms and writes matrika:nav-pending
  const npSlow = new NavigationProgress({ scheduler, storage, document: null, window: null });
  npSlow.start({ forNavigation: true });
  const delayEntry = [...timers.values()].find((t) => t.ms === 150);
  assert.ok(delayEntry);
  delayEntry.fn();
  assert.equal(npSlow.visible, true);
  assert.equal(storage.getItem("matrika:nav-pending"), "1");

  // Completing navigation clears flag cleanly and finishes animation sequence
  npSlow.done();
  assert.equal(storage.getItem("matrika:nav-pending"), null);
  while (timers.size > 0) {
    const [k, t] = timers.entries().next().value;
    timers.delete(k);
    t.fn();
  }
  assert.equal(npSlow.visible, false);

  // Cancel simulates persisted pageshow bfcache reset
  npSlow.start({ forNavigation: true });
  while (timers.size > 0) {
    const firstKey = timers.keys().next().value;
    const t = timers.get(firstKey);
    timers.delete(firstKey);
    if (t.ms === 150) {
      t.fn();
      break;
    }
  }
  assert.equal(npSlow.visible, true);
  npSlow.cancel();
  assert.equal(npSlow.visible, false);
  assert.equal(storage.getItem("matrika:nav-pending"), null);
});
