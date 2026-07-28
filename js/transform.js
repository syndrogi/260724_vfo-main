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
 */
(function () {
  var state = new WeakMap();

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
    el.style.transform =
      "translate(" + s.tx + "px, " + s.ty + "px) " +
      "rotate(" + s.rotate + "rad) " +
      "scale(" + s.scaleX + ", " + s.scaleY + ")";
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
  };
})();
