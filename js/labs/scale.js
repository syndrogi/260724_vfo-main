/**
 * VELFONT OFFICE — Labs / Scale
 * Click a header link or hero letter to select it — a Photoshop-style
 * free-transform box appears with a handle on each corner and each
 * edge. Corner handles resize proportionally around the element's
 * center; edge handles stretch a single axis (top/bottom = height
 * only, left/right = width only). Click empty space, or the same
 * element again, to deselect.
 *
 * Size persists after deselecting, and after the element is moved by
 * any other lab (letter-drag, Physics, Gravity) — translate/rotate/
 * scale are tracked as separate state (see js/transform.js) and always
 * composed together, so moving something never resets how big it is.
 */
(function () {
  if (typeof registerLab !== "function") return;

  var TARGET_SELECTOR = "header a, header button, .hero-content .letter";
  var MIN_SCALE = 0.3;
  var MAX_SCALE = 3;

  // axis: "both" (corner, uniform), "x" (left/right edge), "y" (top/bottom edge)
  var HANDLES = [
    { id: "nw", axis: "both" },
    { id: "ne", axis: "both" },
    { id: "sw", axis: "both" },
    { id: "se", axis: "both" },
    { id: "n", axis: "y" },
    { id: "s", axis: "y" },
    { id: "e", axis: "x" },
    { id: "w", axis: "x" },
  ];

  var active = false;
  var selected = null;
  var box = null;
  var syncRafId = null;

  var dragging = false;
  var suppressNextClick = false;
  var dragAxis = "both";
  var dragCenter = { x: 0, y: 0 };
  var dragStartDist = 1;
  var dragStartScaleX = 1;
  var dragStartScaleY = 1;

  function ensureBox() {
    if (box) return;
    box = document.createElement("div");
    box.className = "labs-scale-box";
    HANDLES.forEach(function (handle) {
      var el = document.createElement("div");
      el.className = "labs-scale-handle labs-scale-handle-" + handle.id;
      el.addEventListener("pointerdown", function (e) {
        onHandleDown(e, handle.axis);
      });
      box.appendChild(el);
    });
    document.body.appendChild(box);
  }

  function positionBox() {
    if (!selected || !box) return;
    var rect = selected.getBoundingClientRect();
    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.width = rect.width + "px";
    box.style.height = rect.height + "px";
  }

  function syncLoop() {
    if (!selected) return;
    positionBox();
    syncRafId = requestAnimationFrame(syncLoop);
  }

  function select(el) {
    if (selected === el) return;
    selected = el;

    if (syncRafId) cancelAnimationFrame(syncRafId);

    if (selected) {
      ensureBox();
      box.hidden = false;
      positionBox();
      syncRafId = requestAnimationFrame(syncLoop);
    } else if (box) {
      box.hidden = true;
    }
  }

  function onClick(e) {
    // A drag still ends with mousedown+mouseup on (roughly) the same
    // spot, which fires a synthetic "click" — without this guard, that
    // click reaches here right after a handle drag and, if the pointer
    // no longer resolves to something inside the box, deselects
    // whatever was just resized.
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    if (box && box.contains(e.target)) return;
    var el = e.target.closest(TARGET_SELECTOR);
    if (!el) {
      select(null);
      return;
    }
    e.preventDefault();
    select(selected === el ? null : el);
  }

  function onHandleDown(e, axis) {
    if (!selected) return;
    e.preventDefault();
    e.stopPropagation();
    dragging = true;
    dragAxis = axis;

    var rect = selected.getBoundingClientRect();
    dragCenter.x = rect.left + rect.width / 2;
    dragCenter.y = rect.top + rect.height / 2;
    dragStartDist = Math.max(1, Math.hypot(e.clientX - dragCenter.x, e.clientY - dragCenter.y));

    var s = window.labsTransform.get(selected);
    dragStartScaleX = s.scaleX;
    dragStartScaleY = s.scaleY;

    window.addEventListener("pointermove", onHandleMove);
    window.addEventListener("pointerup", onHandleUp);
  }

  function clampScale(value) {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
  }

  function onHandleMove(e) {
    if (!dragging || !selected) return;
    var partial = {};

    if (dragAxis === "both") {
      var dist = Math.max(1, Math.hypot(e.clientX - dragCenter.x, e.clientY - dragCenter.y));
      var ratio = dist / dragStartDist;
      partial.scaleX = clampScale(dragStartScaleX * ratio);
      partial.scaleY = clampScale(dragStartScaleY * ratio);
    } else if (dragAxis === "x") {
      // dragStartDist was captured from an e/w handle, which starts
      // exactly on the vertical center line — so it's already a pure
      // horizontal distance, no separate x-only start value needed.
      var distX = Math.max(1, Math.abs(e.clientX - dragCenter.x));
      partial.scaleX = clampScale(dragStartScaleX * (distX / dragStartDist));
    } else if (dragAxis === "y") {
      var distY = Math.max(1, Math.abs(e.clientY - dragCenter.y));
      partial.scaleY = clampScale(dragStartScaleY * (distY / dragStartDist));
    }

    window.labsTransform.update(selected, partial);
    positionBox();
  }

  function onHandleUp() {
    dragging = false;
    suppressNextClick = true;
    window.removeEventListener("pointermove", onHandleMove);
    window.removeEventListener("pointerup", onHandleUp);
  }

  function enable() {
    active = true;
    document.body.classList.add("labs-scale-active");
    document.addEventListener("click", onClick);
  }

  function disable() {
    active = false;
    document.body.classList.remove("labs-scale-active");
    document.removeEventListener("click", onClick);
    select(null);
  }

  registerLab({
    id: "scale",
    title: "scale",
    action: function () {
      if (active) disable();
      else enable();
    },
  });
})();
