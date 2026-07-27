/**
 * VELFONT OFFICE — Labs / Reset
 * Reloads the page. Simplest guaranteed way back to a clean slate
 * after any combination of experiments — Gravity's fall in particular
 * has no in-place undo. Registered first so it renders closest to the
 * LABS trigger (bottom of the stack).
 */
(function () {
  if (typeof registerLab !== "function") return;

  registerLab({
    id: "reset",
    title: "Reset",
    action: function () {
      window.location.reload();
    },
  });
})();
