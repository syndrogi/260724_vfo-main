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
  var dragStartDist = 1;
  var dragStartScaleX = 1;
  var dragStartScaleY = 1;
  // The element's own un-transformed (scale 1, translate 0) box, derived
  // once per drag from its current rendered rect + current transform
  // state. Combined with the anchor's fixed LOCAL position, this lets us
  // solve for whatever translate keeps the anchor visually still at any
  // scale, without ever touching transform-origin mid-drag (see note on
  // FIXED_ORIGIN below for why).
  var dragLayout = { left: 0, top: 0, width: 0, height: 0 };
  var dragAnchorLocal = { x: 0, y: 0 };
  var dragAnchorScreen = { x: 0, y: 0 };
  // Unit vector pointing from the anchor toward where the drag started.
  // Distance is measured as a *signed* projection onto this vector, so
  // dragging past the anchor (to the other side of where you started)
  // goes negative instead of just bottoming out — a negative scale()
  // is a mirror flip, so the letter flips over right as you cross it.
  var dragDir = { x: 1, y: 0 };

  // transform-origin is set ONCE per element and never changed again.
  // Switching it mid-sequence (e.g. "right edge" after a previous "left
  // edge" resize) makes the browser re-pivot the *existing* scale around
  // the new origin, which snaps the element to a different position the
  // instant the origin changes — that was the cause of the "jump when
  // resizing from the opposite side" bug. Keeping origin fixed and doing
  // the "which side stays put" math ourselves (via translate) sidesteps
  // that entirely.
  var FIXED_ORIGIN = "0px 0px";

  function ensureFixedOrigin(el) {
    if (el.style.transformOrigin !== FIXED_ORIGIN) {
      el.style.transformOrigin = FIXED_ORIGIN;
    }
  }

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
    // A flipped element (negative scale) still has a plain positive-width
    // rendered rect — getBoundingClientRect() is always axis-aligned and
    // non-negative — so the ink size has to be un-signed the same way.
    var s = window.labsTransform.get(el);
    var width = ink.width > 0 ? ink.width * Math.abs(s.scaleX) : rect.width;
    var height = ink.height > 0 ? ink.height * Math.abs(s.scaleY) : rect.height;

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
      ensureFixedOrigin(selected);
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

    var s = window.labsTransform.get(selected);
    dragStartScaleX = s.scaleX;
    dragStartScaleY = s.scaleY;

    // Derive the element's un-transformed box (scale 1, translate 0) from
    // its current rendered rect + current transform, so this works
    // correctly no matter how many times it's already been resized.
    var rect = selected.getBoundingClientRect();
    dragLayout.width = rect.width / s.scaleX;
    dragLayout.height = rect.height / s.scaleY;
    dragLayout.left = rect.left - s.tx;
    dragLayout.top = rect.top - s.ty;

    // The anchor (opposite side from the handle) as a fixed point in that
    // local box, and where it currently sits on screen — both stay
    // constant for the rest of this drag; only the scale changes, and we
    // solve for whatever translate keeps dragAnchorScreen fixed.
    dragAnchorLocal.x = (1 - info.fx) * dragLayout.width;
    dragAnchorLocal.y = (1 - info.fy) * dragLayout.height;
    dragAnchorScreen.x = rect.left + (1 - info.fx) * rect.width;
    dragAnchorScreen.y = rect.top + (1 - info.fy) * rect.height;

    var startVecX = e.clientX - dragAnchorScreen.x;
    var startVecY = dragAxis === "x" ? 0 : e.clientY - dragAnchorScreen.y;
    if (dragAxis === "y") startVecX = 0;
    dragStartDist = Math.max(1, Math.hypot(startVecX, startVecY));
    dragDir.x = startVecX / dragStartDist;
    dragDir.y = startVecY / dragStartDist;

    window.addEventListener("pointermove", onHandleMove);
    window.addEventListener("pointerup", onHandleUp);
  }

  // Keeps the sign of `value` but never lets its magnitude collapse to
  // (or through) zero — MIN_SCALE stays the floor on both the growing
  // and the flipped side.
  function clampScale(value) {
    var magnitude = Math.max(MIN_SCALE, Math.abs(value));
    return value < 0 ? -magnitude : magnitude;
  }

  function onHandleMove(e) {
    if (!dragging || !selected) return;
    var partial = {};

    // Signed projection of the current pointer offset onto the initial
    // drag direction: positive while still moving the way the drag
    // started, negative once the pointer has crossed to the other side
    // of the anchor.
    var curVecX = e.clientX - dragAnchorScreen.x;
    var curVecY = e.clientY - dragAnchorScreen.y;
    var signedDist = curVecX * dragDir.x + curVecY * dragDir.y;
    var ratio = signedDist / dragStartDist;

    if (dragAxis === "both") {
      partial.scaleX = clampScale(dragStartScaleX * ratio);
      partial.scaleY = clampScale(dragStartScaleY * ratio);
    } else if (dragAxis === "x") {
      partial.scaleX = clampScale(dragStartScaleX * ratio);
    } else if (dragAxis === "y") {
      partial.scaleY = clampScale(dragStartScaleY * ratio);
    }

    // Solve for the translate that keeps the anchor point pinned at
    // dragAnchorScreen given the new scale — transform-origin never
    // moves (it's fixed at 0,0), so this is the only thing that has to
    // change to make it look like scaling is happening from the anchor.
    if (partial.scaleX !== undefined) {
      partial.tx = dragAnchorScreen.x - dragLayout.left - dragAnchorLocal.x * partial.scaleX;
    }
    if (partial.scaleY !== undefined) {
      partial.ty = dragAnchorScreen.y - dragLayout.top - dragAnchorLocal.y * partial.scaleY;
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
