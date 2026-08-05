/**
 * VELFONT OFFICE — Shared Transform State
 * Several features move, rotate, or resize the same elements
 * independently: letter-drag (main.js), Gravity, Physics, and Scale.
 * Each one writing its own `el.style.transform` string would clobber
 * whatever the others had set — most visibly, resizing something with
 * Scale and then dragging it would silently reset its size. This
 * tracks translate/rotate/scaleX/scaleY as separate per-element state
 * and always composes all of them into one transform, so any one of
 * them can be updated without disturbing the others.
 *
 * Composed via DOMMatrix rather than a hand-built string — same
 * translate/rotate/scale order as before (rotate takes degrees, so the
 * stored radians get converted), but going through a real matrix gives
 * more accurate/consistent results than string-templating and leaves
 * room to compose additional operations later without re-deriving the
 * math by hand.
 */
(function () {
  var state = new WeakMap();
  var RAD_TO_DEG = 180 / Math.PI;

  // Scale locks its selected element for the duration of the selection —
  // Physics's proximity push and Gravity's fall both write tx/ty/rotate
  // on their own per-frame loop, with no idea Scale is mid-drag on the
  // same element; without this, the two loops fight over the same state
  // every frame and a Scale drag can silently lose to whichever wrote
  // last. Physics/Gravity check this before touching a locked element.
  var locked = new WeakSet();

  function getState(el) {
    var s = state.get(el);
    if (!s) {
      s = { tx: 0, ty: 0, rotate: 0, scaleX: 1, scaleY: 1 };
      state.set(el, s);
    }
    return s;
  }

  function compose(el) {
    var s = getState(el);
    var matrix = new DOMMatrix()
      .translate(s.tx, s.ty)
      .rotate(s.rotate * RAD_TO_DEG)
      .scale(s.scaleX, s.scaleY);
    el.style.transform = matrix.toString();
  }

  window.labsTransform = {
    // partial: any of { tx, ty, rotate, scaleX, scaleY } — only given
    // keys change.
    update: function (el, partial) {
      var s = getState(el);
      if (partial.tx !== undefined) s.tx = partial.tx;
      if (partial.ty !== undefined) s.ty = partial.ty;
      if (partial.rotate !== undefined) s.rotate = partial.rotate;
      if (partial.scaleX !== undefined) s.scaleX = partial.scaleX;
      if (partial.scaleY !== undefined) s.scaleY = partial.scaleY;
      compose(el);
    },
    get: function (el) {
      return getState(el);
    },
    lock: function (el) {
      locked.add(el);
    },
    unlock: function (el) {
      locked.delete(el);
    },
    isLocked: function (el) {
      return locked.has(el);
    },
  };
})();
