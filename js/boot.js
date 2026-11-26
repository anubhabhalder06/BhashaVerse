// Pre-paint boot hook: enables progressive reveal/transition states before first paint and restores bfcache state.
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced && !("onpagereveal" in window)) {
    root.classList.add("mt-fallback-entering");
    document.addEventListener("DOMContentLoaded", function () {
      requestAnimationFrame(function () {
        root.classList.remove("mt-fallback-entering");
        root.classList.add("mt-fallback-entered");
      });
    });
  }

  window.addEventListener("pageshow", function () {
    root.classList.remove("mt-nav-leaving", "mt-fallback-entering");
    root.classList.add("mt-fallback-entered");
  });
})();
