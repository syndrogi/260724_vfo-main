/**
 * VELFONT OFFICE — Labs / Scale
 * Click a header link or hero letter to select it — a Photoshop-style
 * free-transform box appears with a handle on each corner and each
 * edge. Dragging a handle grows/shrinks the element from the OPPOSITE
 * side (drag the right edge out and only the right side moves, the
 * left edge stays put) — corners scale both axes proportionally from
 * their opposite corner, edges stretch a single axis from their
 * opposite edge. Click empty space, or the same element again, to
 * deselect.
 *
 * Size persists after deselecting, and after the element is moved by
 * any other lab (letter-drag, Physics, Gravity) — translate/rotate/
 * scale are tracked as separate state (see js/transform.js) and always
 * composed together, so moving something never resets how big it is.
 */
(function () {
  if (typeof registerLab !== "function") return;

  var TARGET_SELECTOR = "header a, header button, .hero-content .letter";
  var MIN_SCALE = 0.05;

  // fx/fy: this handle's position as a fraction of the box (0 = left/top,
  // 1 = right/bottom). The drag anchors at the OPPOSITE fraction, so the
  // dragged side moves and the opposite side holds still.
  var HANDLE_INFO = {
    nw: { fx: 0, fy: 0, axis: "both" },
    ne: { fx: 1, fy: 0, axis: "both" },
    sw: { fx: 0, fy: 1, axis: "both" },
    se: { fx: 1, fy: 1, axis: "both" },
    n: { fx: 0.5, fy: 0, axis: "y" },
    s: { fx: 0.5, fy: 1, axis: "y" },
    e: { fx: 1, fy: 0.5, axis: "x" },
    w: { fx: 0, fy: 0.5, axis: "x" },
  };

  var active = false;
  var selected = null;
  var box = null;
  var syncRafId = null;

  var dragging = false;
  var suppressNextClick = false;
  var dragAxis = "both";
  var dragAnchor = { x: 0, y: 0 };
  var dragStartDist = 1;
  var dragStartScaleX = 1;
  var dragStartScaleY = 1;

  function ensureBox() {
    if (box) return;
    box = document.createElement("div");
    box.className = "labs-scale-box";
    Object.keys(HANDLE_INFO).forEach(function (id) {
      var el = document.createElement("div");
      el.className = "labs-scale-handle labs-scale-handle-" + id;
      el.addEventListener("pointerdown", function (e) {
        onHandleDown(e, id);
      });
      box.appendChild(el);
    });
    document.body.appendChild(box);
  }

  // getBoundingClientRect() on a letter reflects its line-height box, not
  // the glyph's visual ink — for most letters that's noticeably taller
  // (and a bit wider) than what's actually drawn, so the dashed box looked
  // oversized. Canvas's actualBoundingBox* metrics give the true ink size
  // for the same text run at the same font, which we center inside the
  // element's own rect to get a tight box. Purely cosmetic — the actual
  // drag/anchor math in onHandleDown still uses the full element rect, so
  // resizing behavior is unaffected. Non-text targets (icons, the logo)
  // have no text to measure and just fall back to the full rect.
  var glyphMetricsCache = {};
  var measureCanvasCtx = null;

  function getGlyphInk(text, font) {
    var key = font + " " + text;
    var cached = glyphMetricsCache[key];
    if (cached) return cached;

    if (!measureCanvasCtx) {
      measureCanvasCtx = document.createElement("canvas").getContext("2d");
    }
    measureCanvasCtx.font = font;
    var m = measureCanvasCtx.measureText(text);
    var ink = {
      width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
      height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
    };
    glyphMetricsCache[key] = ink;
    return ink;
  }

  function getTightRect(el) {
    var rect = el.getBoundingClientRect();
    var text = el.textContent;
    if (!text || !text.trim()) return rect;

    var cs = getComputedStyle(el);
    var font = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    var ink = getGlyphInk(text, font);

    // ink.width/height come from the element's un-transformed font-size
    // (canvas measureText doesn't know about the scale() we've applied),
    // so they have to be scaled up/down to match however big the element
    // currently is — otherwise the box stops tracking the glyph the
    // moment it's resized and just sits at its original size.
    var s = window.labsTransform.get(el);
    var width = ink.width > 0 ? ink.width * s.scaleX : rect.width;
    var height = ink.height > 0 ? ink.height * s.scaleY : rect.height;

    return {
      left: rect.left + (rect.width - width) / 2,
      top: rect.top + (rect.height - height) / 2,
      width: width,
      height: height,
    };
  }

  function positionBox() {
    if (!selected || !box) return;
    var rect = getTightRect(selected);
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

  function onHandleDown(e, handleId) {
    if (!selected) return;
    e.preventDefault();
    e.stopPropagation();
    dragging = true;

    var info = HANDLE_INFO[handleId];
    dragAxis = info.axis;

    // Anchor at the opposite side from the handle being dragged, and
    // pivot scaling from that same point, so it's the dragged side that
    // visibly moves.
    var rect = selected.getBoundingClientRect();
    dragAnchor.x = rect.left + (1 - info.fx) * rect.width;
    dragAnchor.y = rect.top + (1 - info.fy) * rect.height;
    selected.style.transformOrigin = (1 - info.fx) * 100 + "% " + (1 - info.fy) * 100 + "%";

    if (dragAxis === "both") {
      dragStartDist = Math.max(1, Math.hypot(e.clientX - dragAnchor.x, e.clientY - dragAnchor.y));
    } else if (dragAxis === "x") {
      dragStartDist = Math.max(1, Math.abs(e.clientX - dragAnchor.x));
    } else {
      dragStartDist = Math.max(1, Math.abs(e.clientY - dragAnchor.y));
    }

    var s = window.labsTransform.get(selected);
    dragStartScaleX = s.scaleX;
    dragStartScaleY = s.scaleY;

    window.addEventListener("pointermove", onHandleMove);
    window.addEventListener("pointerup", onHandleUp);
  }

  function clampScale(value) {
    return Math.max(MIN_SCALE, value);
  }

  function onHandleMove(e) {
    if (!dragging || !selected) return;
    var partial = {};

    if (dragAxis === "both") {
      var dist = Math.max(1, Math.hypot(e.clientX - dragAnchor.x, e.clientY - dragAnchor.y));
      var ratio = dist / dragStartDist;
      partial.scaleX = clampScale(dragStartScaleX * ratio);
      partial.scaleY = clampScale(dragStartScaleY * ratio);
    } else if (dragAxis === "x") {
      var distX = Math.max(1, Math.abs(e.clientX - dragAnchor.x));
      partial.scaleX = clampScale(dragStartScaleX * (distX / dragStartDist));
    } else if (dragAxis === "y") {
      var distY = Math.max(1, Math.abs(e.clientY - dragAnchor.y));
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
