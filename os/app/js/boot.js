/**
 * Founder OS — Boot
 *
 * Runs after the topbar and hub components are ready. The synchronous
 * guard in app/index.html's <head> already redirected away if there's no
 * session, but a redirect can't stop code already scheduled to run, so this
 * re-checks before touching anything — defense in depth, not duplication.
 */
(function () {
  const raw = sessionStorage.getItem("founderSession");
  if (!raw) {
    window.location.replace("../index.html");
    return;
  }

  let member;
  try {
    member = JSON.parse(raw);
  } catch (err) {
    window.location.replace("../index.html");
    return;
  }

  if (window.FounderTopbar) window.FounderTopbar.render(member);
  if (window.FounderHub) window.FounderHub.openDefault();

  const desktop = document.getElementById("desktop");
  if (desktop) desktop.classList.add("visible");
})();
