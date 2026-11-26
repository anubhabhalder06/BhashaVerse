// @ts-check
import { FEATURES } from "./config/features.js";
import { Container } from "./core/Container.js";
import { EventBus } from "./core/EventBus.js";
import { SafeStorage } from "./utils/storage.js";
import { JsonDataSource } from "./data/JsonDataSource.js";
import { LanguageRepository } from "./data/LanguageRepository.js";
import { ResourceRepository } from "./data/ResourceRepository.js";
import { MediaRepository } from "./data/MediaRepository.js";
import { StoryRepository } from "./data/StoryRepository.js";
import { PlaceRepository } from "./data/PlaceRepository.js";
import { LocalContributionStore } from "./data/LocalContributionStore.js";
import { WordmarkRepository } from "./data/WordmarkRepository.js";
import { RightsPolicy } from "./services/RightsPolicy.js";
import { SearchService } from "./services/SearchService.js";
import { FilterService } from "./services/FilterService.js";
import { MapService } from "./services/MapService.js";
import { AudioService } from "./services/AudioService.js";
import { ThemeService } from "./services/ThemeService.js";
import { MotionPreferences } from "./services/MotionPreferences.js";
import { LinkPrefetcher } from "./services/LinkPrefetcher.js";
import { FontGate } from "./services/FontGate.js";
import { BookmarkService } from "./services/BookmarkService.js";
import { KnowledgeBase } from "./chat/KnowledgeBase.js";
import { IntentMatcher } from "./chat/IntentMatcher.js";
import { ScriptedChatEngine } from "./chat/ScriptedChatEngine.js";
import { ChatSession } from "./chat/ChatSession.js";
import { RightsBadge } from "./components/RightsBadge.js";
import { LanguageCard } from "./components/LanguageCard.js";
import { ResourceCard } from "./components/ResourceCard.js";
import { MediaFigure } from "./components/MediaFigure.js";
import { AudioPlayer } from "./components/AudioPlayer.js";
import { NavigationProgress } from "./components/NavigationProgress.js";
import { MapView } from "./components/MapView.js";
import { ChatWidget } from "./components/ChatWidget.js";
import { MatrikaHeader } from "./components/MatrikaHeader.js";
import { MatrikaFooter } from "./components/MatrikaFooter.js";
import { HomePage } from "./pages/HomePage.js";
import { LanguagesPage } from "./pages/LanguagesPage.js";
import { LanguageProfilePage } from "./pages/LanguageProfilePage.js";
import { LibraryPage } from "./pages/LibraryPage.js";
import { LibraryItemPage } from "./pages/LibraryItemPage.js";
import { GalleryPage } from "./pages/GalleryPage.js";
import { AudioPage } from "./pages/AudioPage.js";
import { MapPage } from "./pages/MapPage.js";
import { SearchPage } from "./pages/SearchPage.js";
import { HistoryPage } from "./pages/HistoryPage.js";
import { CulturePage } from "./pages/CulturePage.js";
import { StoriesPage } from "./pages/StoriesPage.js";
import { ContributePage } from "./pages/ContributePage.js";
import { AdminPage } from "./pages/AdminPage.js";
import { AboutPage } from "./pages/AboutPage.js";
import { StaticPage } from "./pages/StaticPage.js";

/**
 * Single composition root wiring all services, repositories, components, and pages.
 * @returns {Container}
 */
export function buildContainer() {
  const c = new Container();

  c.singleton("eventBus", () => new EventBus());
  c.singleton("storage", () => new SafeStorage());
  c.singleton("dataSource", () => new JsonDataSource("data"));

  c.singleton("languageRepo", (di) => new LanguageRepository(di.resolve("dataSource")));
  c.singleton("resourceRepo", (di) => new ResourceRepository(di.resolve("dataSource")));
  c.singleton("mediaRepo", (di) => new MediaRepository(di.resolve("dataSource")));
  c.singleton("storyRepo", (di) => new StoryRepository(di.resolve("dataSource")));
  c.singleton("placeRepo", (di) => new PlaceRepository(di.resolve("dataSource")));
  c.singleton("contributionStore", (di) => new LocalContributionStore(di.resolve("storage")));
  c.singleton("wordmarkRepo", (di) => new WordmarkRepository(di.resolve("dataSource"), di.resolve("languageRepo")));

  c.singleton("rightsPolicy", () => new RightsPolicy());
  c.singleton("filterService", () => new FilterService());
  c.singleton("mapService", () => new MapService());
  c.singleton("audioService", () => new AudioService());
  c.singleton("themeService", (di) => new ThemeService(di.resolve("storage")));
  c.singleton("motionPrefs", (di) => new MotionPreferences(di.resolve("storage")));
  c.singleton("navProgress", () => new NavigationProgress());
  c.singleton("linkPrefetcher", () => new LinkPrefetcher());
  c.singleton("fontGate", () => new FontGate(3000));
  c.singleton("bookmarkService", (di) => new BookmarkService(di.resolve("storage")));

  let searchPromise = null;
  c.value("getSearchService", () => {
    if (!searchPromise) {
      searchPromise = Promise.all([
        c.resolve("languageRepo").list(),
        c.resolve("resourceRepo").list(),
        c.resolve("mediaRepo").listMedia(),
        c.resolve("mediaRepo").listAudio(),
        c.resolve("storyRepo").list(),
      ]).then(([languages, resources, media, audio, stories]) => new SearchService({ languages, resources, media, audio, stories }));
    }
    return searchPromise;
  });

  c.singleton("rightsBadge", (di) => new RightsBadge(di.resolve("rightsPolicy")));
  c.singleton("languageCard", (di) => new LanguageCard({ rightsBadge: di.resolve("rightsBadge"), bookmarkService: di.resolve("bookmarkService") }));
  c.singleton("resourceCard", (di) => new ResourceCard({ rightsBadge: di.resolve("rightsBadge"), bookmarkService: di.resolve("bookmarkService") }));
  c.singleton("mediaFigure", (di) => new MediaFigure({ rightsBadge: di.resolve("rightsBadge") }));
  c.singleton("audioPlayer", (di) => new AudioPlayer(di.resolve("audioService")));
  c.singleton("mapView", (di) => new MapView(di.resolve("mapService")));

  c.singleton("knowledgeBase", (di) => new KnowledgeBase(di.resolve("dataSource")));
  c.singleton("intentMatcher", () => new IntentMatcher());
  c.singleton(
    "chatEngine",
    (di) =>
      new ScriptedChatEngine({
        knowledgeBase: di.resolve("knowledgeBase"),
        matcher: di.resolve("intentMatcher"),
        languageRepo: di.resolve("languageRepo"),
        getSearchService: di.resolve("getSearchService"),
      })
  );
  c.singleton("chatSession", () => new ChatSession());
  c.singleton(
    "chatWidget",
    (di) =>
      new ChatWidget({
        engine: di.resolve("chatEngine"),
        session: di.resolve("chatSession"),
        knowledgeBase: di.resolve("knowledgeBase"),
      })
  );

  return c;
}

/** @param {string} pageName @param {Container} container */
function createPage(pageName, container) {
  switch (pageName) {
    case "home": return new HomePage(container);
    case "languages": return new LanguagesPage(container);
    case "language-profile": return new LanguageProfilePage(container);
    case "library": return new LibraryPage(container);
    case "library-item": return new LibraryItemPage(container);
    case "gallery": return new GalleryPage(container);
    case "audio": return new AudioPage(container);
    case "map": return new MapPage(container);
    case "search": return new SearchPage(container);
    case "history": return new HistoryPage(container);
    case "culture": return new CulturePage(container);
    case "stories": return new StoriesPage(container);
    case "contribute": return new ContributePage(container);
    case "admin": return new AdminPage(container);
    case "about": return new AboutPage(container);
    case "guidelines": return new StaticPage(container, "Contribution Guidelines");
    case "privacy": return new StaticPage(container, "Privacy");
    case "terms": return new StaticPage(container, "Terms of Use");
    case "copyright": return new StaticPage(container, "Copyright & Reuse Policy");
    case "contact": return new StaticPage(container, "Contact & Corrections");
    case "not-found": return new StaticPage(container, "Page Not Found");
    default: return new StaticPage(container, "Archive");
  }
}

function registerElements() {
  if (!customElements.get("matrika-header")) customElements.define("matrika-header", MatrikaHeader);
  if (!customElements.get("matrika-footer")) customElements.define("matrika-footer", MatrikaFooter);
}

async function bootstrap() {
  const container = buildContainer();
  container.resolve("themeService").init();
  const audioService = container.resolve("audioService");
  const navProgress = container.resolve("navProgress");
  const linkPrefetcher = container.resolve("linkPrefetcher");
  navProgress.init();
  linkPrefetcher.init();
  registerElements();

  window.addEventListener("pagehide", () => {
    audioService.pauseAll();
  });

  document.querySelectorAll("matrika-header").forEach((el) => /** @type {MatrikaHeader} */ (el).hydrate(container));
  document.querySelectorAll("matrika-footer").forEach((el) => /** @type {MatrikaFooter} */ (el).hydrate());

  const pageName = document.body.dataset.page || "home";
  const page = createPage(pageName, container);
  await page.mount();

  if (FEATURES.enableChatbot) {
    const chatHost = document.createElement("div");
    document.body.appendChild(chatHost);
    await container.resolve("chatWidget").mount(chatHost);
  }
}

if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
    },
    { once: true }
  );
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    bootstrap().catch((err) => {
      console.error("Matrika bootstrap error:", err);
    });
  });
}
