// Dark mode (cycle 4 stickies): dark is the default; the icon button in the top-right of the header toggles it.
// The choice is kept in this browser only (localStorage); nothing is sent anywhere.
(function () {
  var KEY = "harvest-theme", root = document.documentElement, saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  root.dataset.theme = saved === "light" ? "light" : "dark";
  function sync() {
    var dark = root.dataset.theme === "dark";
    document.querySelectorAll(".theme-toggle").forEach(function (b) {
      b.setAttribute("aria-pressed", String(dark));
      b.title = dark ? "Dark mode on — switch to light mode" : "Light mode on — switch to dark mode";
    });
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".theme-toggle"); if (!b) return;
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem(KEY, root.dataset.theme); } catch (err) {}
    sync();
  });
  document.addEventListener("DOMContentLoaded", sync);
  window.addEventListener("load", sync);
  window.harvestThemeSync = sync;
})();
