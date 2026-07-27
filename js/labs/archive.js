/**
 * VELFONT OFFICE — Labs / Archive
 * Placeholder.
 */
(function () {
  if (typeof registerLab !== "function") return;

  registerLab({
    id: "archive-lab",
    title: "Archive",
    action: function () {
      if (typeof labsNotice === "function") labsNotice("Coming Soon");
    },
  });
})();
