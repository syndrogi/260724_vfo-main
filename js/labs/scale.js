/**
 * VELFONT OFFICE — Labs / Scale
 * Click a header link or hero letter to select it, then scroll to
 * resize it. Scale persists after a piece is resized — toggling Scale
 * off just stops selecting/resizing, it doesn't snap anything back
 * (use Reset for that). Click empty space, or the same element again,
 * to deselect.
 */
(function () {
  if (typeof registerLab !== "function") return;

  var TARGET_SELECTOR = "header a, header button, .hero-content .letter";
  var MIN_SCALE = 0.3;
  var MAX_SCALE = 3;
  var WHEEL_STEP = 0.0015;

  var active = false;
  var selected = null;
  var scales = new WeakMap();

  function currentScale(el) {
    return scales.get(el) || 1;
  }

  function applyScale(el, value) {
    var clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
    scales.set(el, clamped);
    el.style.transform = clamped === 1 ? "" : "scale(" + clamped.toFixed(3) + ")";
  }

  function select(el) {
    if (selected === el) return;
    if (selected) selected.classList.remove("labs-scale-selected");
    selected = el;
    if (selected) selected.classList.add("labs-scale-selected");
  }

  function onClick(e) {
    var el = e.target.closest(TARGET_SELECTOR);
    if (!el) {
      select(null);
      return;
    }
    e.preventDefault();
    select(selected === el ? null : el);
  }

  function onWheel(e) {
    if (!selected) return;
    e.preventDefault();
    applyScale(selected, currentScale(selected) - e.deltaY * WHEEL_STEP);
  }

  function enable() {
    active = true;
    document.body.classList.add("labs-scale-active");
    document.addEventListener("click", onClick);
    document.addEventListener("wheel", onWheel, { passive: false });
  }

  function disable() {
    active = false;
    document.body.classList.remove("labs-scale-active");
    document.removeEventListener("click", onClick);
    document.removeEventListener("wheel", onWheel, { passive: false });
    select(null);
  }

  registerLab({
    id: "scale",
    title: "Scale",
    action: function () {
      if (active) disable();
      else enable();
    },
  });
})();
