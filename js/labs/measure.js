/**
 * VELFONT OFFICE — Labs / Measure
 * Placeholder.
 */
(function () {
  if (typeof registerLab !== "function") return;

  registerLab({
    id: "measure",
    title: "Measure",
    action: function () {
      if (typeof labsNotice === "function") labsNotice("Coming Soon");
    },
  });
})();
