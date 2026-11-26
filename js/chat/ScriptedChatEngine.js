// @ts-check
import { ChatEngine } from "./ChatEngine.js";
import { BRAND } from "../config/brand.js";
import { normalizeText } from "../utils/format.js";

/**
 * Deterministic no-backend assistant using KnowledgeBase + IntentMatcher + SearchService.
 * Never makes external network calls or invents archive facts.
 */
export class ScriptedChatEngine extends ChatEngine {
  /**
   * @param {{
   *   knowledgeBase: import('./KnowledgeBase.js').KnowledgeBase,
   *   matcher: import('./IntentMatcher.js').IntentMatcher,
   *   languageRepo: import('../data/LanguageRepository.js').LanguageRepository,
   *   getSearchService: () => Promise<import('../services/SearchService.js').SearchService>,
   * }} deps
   */
  constructor(deps) {
    super();
    this.knowledgeBase = deps.knowledgeBase;
    this.matcher = deps.matcher;
    this.languageRepo = deps.languageRepo;
    this.getSearchService = deps.getSearchService;
  }

  /**
   * @param {string} message
   * @returns {Promise<{ reply: string, links: Array<{ label: string, href: string }>, results?: Array<{ title: string, subtitle: string, href: string }> }>}
   */
  async reply(message) {
    const clean = String(message || "").trim();
    const [kb, langs] = await Promise.all([this.knowledgeBase.load(), this.languageRepo.list()]);
    const norm = normalizeText(clean);

    // 1. Check direct language query first so language names resolve directly to their profile
    const directLang = langs.find((l) => {
      const candidates = [l.name, l.nativeName, ...(l.altNames || []), l.id];
      return candidates.some((c) => c && norm.includes(normalizeText(c)));
    });

    const intentHit = this.matcher.match(clean, kb.intents || [], kb.confidenceThreshold || 0.35);

    if (directLang && intentHit.confidence < 0.78) {
      return {
        reply: `${directLang.name} (${directLang.family} · ${directLang.region}): ${directLang.overview}`,
        links: [
          { label: `Open ${directLang.name} profile`, href: `language-profile.html?id=${encodeURIComponent(directLang.id)}` },
          { label: "View on Language Map", href: `map.html?lang=${encodeURIComponent(directLang.id)}` },
        ],
      };
    }

    if (intentHit.intentId !== "fallback") {
      const matched = (kb.intents || []).find((i) => i.id === intentHit.intentId);
      if (matched) {
        return {
          reply: matched.reply,
          links: matched.links || [],
        };
      }
    }

    // 2. Fallback to SearchService for topic queries (max 3 result cards + See all link)
    const search = await this.getSearchService();
    const hit = search.search(clean);
    if (hit.total > 0) {
      const flat = [
        ...hit.groups.languages,
        ...hit.groups.library,
        ...hit.groups.images,
        ...hit.groups.audio,
        ...hit.groups.stories,
      ].slice(0, 3);
      return {
        reply: `I found ${hit.total} matching ${hit.total === 1 ? "record" : "records"} in ${BRAND.name}. Here are the top results:`,
        results: flat.map((r) => ({ title: r.title, subtitle: r.subtitle, href: r.href })),
        links: [{ label: "See all results", href: `search.html?q=${encodeURIComponent(clean)}` }],
      };
    }

    return {
      reply: kb.fallback?.reply || "I cannot answer that directly. Try global search or Contact / Report.",
      links: kb.fallback?.links || [
        { label: "Search the archive", href: "search.html" },
        { label: "Contact / Report", href: "contact.html" },
      ],
    };
  }
}
