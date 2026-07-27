/**
 * VELFONT OFFICE — Labs / Physics
 * Placeholder.
 */
(function () {
  if (typeof registerLab !== "function") return;

  registerLab({
    id: "physics",
    title: "Physics",
    action: function () {
      if (typeof labsNotice === "function") labsNotice("Coming Soon");
    },
  });
})();
