/**
 * VELFONT OFFICE — Labs / Archive
 * Toggles a grayscale + vignette filter over the whole page, like
 * looking at an old archived scan — it also flattens the red hover
 * accent to gray while active. Click Archive again to turn it off.
 */
(function () {
  if (typeof registerLab !== "function") return;

  var active = false;
  var vignette = null;

  function ensureVignette() {
    if (vignette) return;
    vignette = document.createElement("div");
    vignette.className = "labs-archive-vignette";
    document.body.appendChild(vignette);
  }

  function enable() {
    active = true;
    ensureVignette();
    vignette.hidden = false;
    document.documentElement.classList.add("labs-archive");
  }

  function disable() {
    active = false;
    if (vignette) vignette.hidden = true;
    document.documentElement.classList.remove("labs-archive");
  }

  registerLab({
    id: "archive-lab",
    title: "Archive",
    action: function () {
      if (active) disable();
      else enable();
    },
  });
})();
