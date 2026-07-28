/**
 * VELFONT OFFICE — Contact
 * Opens a panel on the right of the hero instead of scrolling to a
 * section — click "contact" (header or mobile menu) to toggle it.
 * Closes on: the toggle again, the × button, outside click, Escape.
 *
 * The form doesn't submit anywhere yet (no backend wired up) — it
 * just confirms receipt in place. Storing submissions is planned
 * separately.
 */
(function () {
  var panel = document.getElementById("contactPanel");
  var closeBtn = document.getElementById("contactClose");
  var form = document.getElementById("contactForm");
  var status = document.getElementById("contactStatus");
  var toggles = document.querySelectorAll(".js-contact-toggle");
  if (!panel || !toggles.length) return;

  var isOpen = false;

  function setToggleState(expanded) {
    toggles.forEach(function (t) {
      t.setAttribute("aria-expanded", String(expanded));
    });
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    setToggleState(true);
  }

  function closePanel() {
    if (!isOpen) return;
    isOpen = false;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    setToggleState(false);
  }

  toggles.forEach(function (toggle) {
    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      if (isOpen) closePanel();
      else openPanel();
    });
  });

  if (closeBtn) closeBtn.addEventListener("click", closePanel);

  document.addEventListener("click", function (e) {
    if (!isOpen) return;
    if (panel.contains(e.target)) return;
    if (e.target.closest(".js-contact-toggle")) return;
    closePanel();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) closePanel();
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      form.reset();
      if (status) status.textContent = "Thanks — we'll be in touch.";
    });
  }
})();
