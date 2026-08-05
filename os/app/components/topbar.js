/**
 * Founder OS — Topbar Component
 *
 * Renders the signed-in member (read from sessionStorage — see js/login.js
 * and app/js/session-guard.js), runs the KR/NY clocks, and handles the
 * logout menu. Logging out clears the session and sends the browser back
 * to the login page — a real navigation, not an in-page reset.
 */
(function () {
  const topbarMemberName = document.getElementById("topbar-member-name");
  const memberBadge = document.getElementById("member-badge");
  const memberTrigger = document.getElementById("member-trigger");
  const logoutMenu = document.getElementById("logout-menu");
  const logoutButton = document.getElementById("logout-btn");

  // KR is the founders' home base; NY stands in for the other side of the
  // business day. Both use the IANA zone (not a fixed UTC offset) so DST
  // is handled automatically.
  const ZONES = [
    { id: "kr", timeZone: "Asia/Seoul" },
    { id: "ny", timeZone: "America/New_York" }
  ];

  function formatZoneDate(date, timeZone) {
    const ymd = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(date);
    const weekday = new Intl.DateTimeFormat("ko-KR", {
      timeZone,
      weekday: "narrow"
    }).format(date);
    return ymd.replace(/-/g, "/") + "/(" + weekday + ")";
  }

  function formatZoneTime(date, timeZone) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).format(date);
  }

  function updateClock() {
    const now = new Date();
    ZONES.forEach((zone) => {
      const dateEl = document.getElementById("topbar-date-" + zone.id);
      const timeEl = document.getElementById("topbar-time-" + zone.id);
      if (dateEl) dateEl.textContent = formatZoneDate(now, zone.timeZone);
      if (timeEl) timeEl.textContent = formatZoneTime(now, zone.timeZone);
    });
  }

  function startClock() {
    updateClock();
    setInterval(updateClock, 1000);
  }

  function closeLogoutMenu() {
    if (logoutMenu) logoutMenu.classList.remove("open");
  }

  if (memberTrigger && logoutMenu) {
    memberTrigger.addEventListener("click", function (event) {
      event.stopPropagation();
      logoutMenu.classList.toggle("open");
    });

    document.addEventListener("click", function (event) {
      if (!logoutMenu.contains(event.target) && event.target !== memberTrigger) {
        closeLogoutMenu();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeLogoutMenu();
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      sessionStorage.removeItem("founderSession");
      window.location.href = "../index.html";
    });
  }

  window.FounderTopbar = {
    render: function (member) {
      if (topbarMemberName) topbarMemberName.textContent = member.name;
      if (memberBadge) memberBadge.style.backgroundColor = member.color;
      startClock();
    }
  };
})();
