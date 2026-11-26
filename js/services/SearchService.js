// @ts-check
import { editDistance, isLatinText, normalizeText, tokenizeSearch } from "../utils/format.js";

/**
 * Pure client-side archive search index and ranker (Node-testable, zero DOM).
 */
export class SearchService {
  /**
   * Build searchable document descriptors from loaded repositories.
   * @param {{
   *   languages?: import('../models/Language.js').Language[],
   *   resources?: import('../models/Resource.js').Resource[],
   *   media?: import('../models/MediaItem.js').MediaItem[],
   *   audio?: import('../models/AudioItem.js').AudioItem[],
   *   stories?: import('../models/Story.js').Story[],
   * }} datasets
   */
  constructor(datasets = {}) {
    /** @type {Array<{ id: string, group: string, title: string, subtitle: string, href: string, fields: Array<{ text: string, weight: number }>, tokensByField: string[][] }>} */
    this.docs = [];
    this.buildIndex(datasets);
  }

  /**
   * Index every repository item across weighted metadata fields.
   * @param {Record<string, any[]>} datasets
   */
  buildIndex(datasets) {
    this.docs = [];
    for (const lang of datasets.languages || []) {
      const vocabText = (lang.vocabulary || [])
        .map((v) => `${v.script} ${v.roman} ${v.meaning}`)
        .join(" ");
      this.addDoc({
        id: lang.id,
        group: "languages",
        title: `${lang.name}${lang.nativeName && lang.nativeName !== lang.name ? ` (${lang.nativeName})` : ""}`,
        subtitle: `${lang.family} · ${lang.region} · ${lang.scriptLabel}`,
        href: `language-profile.html?id=${encodeURIComponent(lang.id)}`,
        fields: [
          { text: `${lang.name} ${lang.nativeName} ${(lang.altNames || []).join(" ")}`, weight: 10 },
          { text: `${lang.scriptLabel} ${(lang.scripts || []).join(" ")} ${lang.preferredNameNote}`, weight: 6 },
          { text: `${lang.region} ${lang.family} ${lang.place?.region || ""}`, weight: 4 },
          { text: `${lang.overview} ${vocabText}`, weight: 2 },
        ],
      });
    }

    for (const res of datasets.resources || []) {
      this.addDoc({
        id: res.id,
        group: "library",
        title: res.title,
        subtitle: `${res.category} · ${res.rights?.licence || res.rights?.status || ""}`,
        href: `library-item.html?id=${encodeURIComponent(res.id)}`,
        fields: [
          { text: `${res.title} ${(res.altTitles || []).join(" ")}`, weight: 10 },
          { text: `${(res.languages || []).map((l) => l.communityName).join(" ")} ${res.category}`, weight: 6 },
          { text: `${(res.creators || []).map((c) => c.name).join(" ")} ${(res.description?.keywords || []).join(" ")}`, weight: 5 },
          { text: `${res.summary} ${res.place?.region || ""}`, weight: 2 },
        ],
      });
    }

    for (const item of datasets.media || []) {
      this.addDoc({
        id: item.id,
        group: "images",
        title: item.title,
        subtitle: `${item.collection} · ${item.place?.region || ""}`,
        href: `gallery.html#${encodeURIComponent(item.id)}`,
        fields: [
          { text: item.title, weight: 10 },
          { text: `${item.collection} ${(item.languages || []).map((l) => l.communityName).join(" ")}`, weight: 6 },
          { text: `${(item.creators || []).map((c) => c.name).join(" ")} ${(item.description?.keywords || []).join(" ")}`, weight: 4 },
          { text: `${item.summary} ${item.description?.caption || ""}`, weight: 2 },
        ],
      });
    }

    for (const aud of datasets.audio || []) {
      this.addDoc({
        id: aud.id,
        group: "audio",
        title: aud.title,
        subtitle: `${aud.collection} · ${aud.rights?.licence || ""}`,
        href: `audio.html#${encodeURIComponent(aud.id)}`,
        fields: [
          { text: aud.title, weight: 10 },
          { text: `${aud.collection} ${(aud.languages || []).map((l) => l.communityName).join(" ")}`, weight: 6 },
          { text: `${aud.description?.caption || ""} ${aud.description?.translation || ""} ${(aud.description?.keywords || []).join(" ")}`, weight: 4 },
          { text: aud.summary, weight: 2 },
        ],
      });
    }

    for (const st of datasets.stories || []) {
      this.addDoc({
        id: st.id,
        group: "stories",
        title: st.title,
        subtitle: `${(st.languages || []).map((l) => l.communityName).join(", ")} · ${st.place?.region || ""}`,
        href: `stories.html#${encodeURIComponent(st.id)}`,
        fields: [
          { text: st.title, weight: 10 },
          { text: `${(st.languages || []).map((l) => l.communityName).join(" ")} ${st.description?.subject || ""}`, weight: 6 },
          { text: `${st.summary} ${(st.description?.keywords || []).join(" ")}`, weight: 3 },
        ],
      });
    }
  }

  /** @param {{ id: string, group: string, title: string, subtitle: string, href: string, fields: Array<{ text: string, weight: number }> }} doc */
  addDoc(doc) {
    const tokensByField = doc.fields.map((f) => tokenizeSearch(f.text));
    this.docs.push({ ...doc, tokensByField });
  }

  /**
   * Score and group matching records cleanly without unrelated filler results.
   * @param {string} rawQuery
   * @param {string} [groupFilter=""]
   * @returns {{ total: number, query: string, groups: Record<string, Array<{ id: string, group: string, title: string, subtitle: string, href: string, score: number }>> }}
   */
  search(rawQuery, groupFilter = "") {
    const query = String(rawQuery || "").trim();
    const qNorm = normalizeText(query);
    const qTokens = tokenizeSearch(query);
    /** @type {Record<string, Array<{ id: string, group: string, title: string, subtitle: string, href: string, score: number }>>} */
    const groups = { languages: [], library: [], images: [], audio: [], stories: [] };

    if (!qTokens.length) {
      return { total: 0, query, groups };
    }

    for (const doc of this.docs) {
      if (groupFilter && doc.group !== groupFilter) continue;
      let totalScore = 0;
      let matchedAllTokens = true;

      for (const qt of qTokens) {
        let bestTokenScore = 0;
        const qtLatin = isLatinText(qt);

        doc.fields.forEach((field, fIdx) => {
          const fTokens = doc.tokensByField[fIdx];
          for (const ft of fTokens) {
            if (ft === qt) {
              bestTokenScore = Math.max(bestTokenScore, field.weight * 3);
            } else if (ft.startsWith(qt) || (!qtLatin && ft.includes(qt))) {
              bestTokenScore = Math.max(bestTokenScore, field.weight * 2);
            } else if (qtLatin && isLatinText(ft) && qt.length >= 4 && Math.abs(ft.length - qt.length) <= 1) {
              if (editDistance(qt, ft) <= 1) {
                bestTokenScore = Math.max(bestTokenScore, field.weight * 1);
              }
            }
          }
          const fullNorm = normalizeText(field.text);
          if (fullNorm.includes(qNorm) && qTokens.length > 1) {
            bestTokenScore = Math.max(bestTokenScore, field.weight * 3.5);
          }
        });

        if (bestTokenScore === 0) {
          matchedAllTokens = false;
          break;
        }
        totalScore += bestTokenScore;
      }

      if (matchedAllTokens && totalScore > 0) {
        groups[doc.group].push({
          id: doc.id,
          group: doc.group,
          title: doc.title,
          subtitle: doc.subtitle,
          href: doc.href,
          score: totalScore,
        });
      }
    }

    let total = 0;
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
      total += groups[key].length;
    }

    return { total, query, groups };
  }
}
