/**
 * VELFONT OFFICE — Shared Transform State
 * Several features move, rotate, or resize the same elements
 * independently: letter-drag (main.js), Gravity, Physics, and Scale.
 * Each one writing its own `el.style.transform` string would clobber
 * whatever the others had set — most visibly, resizing something with
 * Scale and then dragging it would silently reset its size. This
 * tracks translate/rotate/scale as separate per-element state and
 * always composes all three into one transform, so any one of them
 * can be updated without disturbing the others.
 */
(function () {
  var state = new WeakMap();

  function getState(el) {
    var s = state.get(el);
    if (!s) {
      s = { tx: 0, ty: 0, rotate: 0, scale: 1 };
      state.set(el, s);
    }
    return s;
  }

  function compose(el) {
    var s = getState(el);
    el.style.transform =
      "translate(" + s.tx + "px, " + s.ty + "px) " +
      "rotate(" + s.rotate + "rad) " +
      "scale(" + s.scale + ")";
  }

  window.labsTransform = {
    // partial: any of { tx, ty, rotate, scale } — only given keys change.
    update: function (el, partial) {
      var s = getState(el);
      if (partial.tx !== undefined) s.tx = partial.tx;
      if (partial.ty !== undefined) s.ty = partial.ty;
      if (partial.rotate !== undefined) s.rotate = partial.rotate;
      if (partial.scale !== undefined) s.scale = partial.scale;
      compose(el);
    },
    get: function (el) {
      return getState(el);
    },
  };
})();
