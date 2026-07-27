/**
 * VELFONT OFFICE — Labs / Noise
 * Placeholder.
 */
(function () {
  if (typeof registerLab !== "function") return;

  registerLab({
    id: "noise",
    title: "Noise",
    action: function () {
      if (typeof labsNotice === "function") labsNotice("Coming Soon");
    },
  });
})();
