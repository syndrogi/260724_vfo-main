/**
 * VELFONT OFFICE — Hero Slider
 * Fades between .hero-slide elements every 4s.
 * The first slide already carries `.is-active` in the HTML, so the hero
 * renders correctly even if this script never runs.
 */
(function () {
  var AUTOPLAY_MS = 4000;

  var hero = document.getElementById("hero");
  if (!hero) return;

  var slides = hero.querySelectorAll(".hero-slide");
  var currentEl = hero.querySelector(".slide-current");
  var totalEl = hero.querySelector(".slide-total");

  if (!slides.length) return;

  var total = slides.length;
  var current = 0;

  Array.prototype.forEach.call(slides, function (slide, i) {
    slide.classList.toggle("is-active", i === 0);
  });

  if (totalEl) totalEl.textContent = pad(total);
  updateIndex();

  var reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (total > 1 && !reduceMotion) {
    setInterval(advance, AUTOPLAY_MS);
  }

  function advance() {
    slides[current].classList.remove("is-active");
    current = (current + 1) % total;
    slides[current].classList.add("is-active");
    updateIndex();
  }

  function updateIndex() {
    if (currentEl) currentEl.textContent = pad(current + 1);
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }
})();

/**
 * VELFONT OFFICE — Header Navigation
 * Mobile off-canvas drawer + scroll-driven active-link state.
 */
(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".menu-toggle");
  var drawer = document.getElementById("mobile-nav");
  var backdrop = document.querySelector(".nav-backdrop");
  if (!header || !toggle || !drawer || !backdrop) return;

  var mobileMedia = window.matchMedia("(max-width: 768px)");

  function openMenu() {
    drawer.classList.add("is-open");
    drawer.removeAttribute("inert");
    backdrop.classList.add("is-visible");
    backdrop.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    toggle.textContent = "CLOSE";
    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("inert", "");
    backdrop.classList.remove("is-visible");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "MENU";
    document.body.style.overflow = "";
    window.setTimeout(function () {
      if (!drawer.classList.contains("is-open")) backdrop.hidden = true;
    }, 350);
  }

  toggle.addEventListener("click", function () {
    if (drawer.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  backdrop.addEventListener("click", closeMenu);

  drawer.addEventListener("click", function (e) {
    if (e.target.tagName === "A") closeMenu();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) closeMenu();
  });

  mobileMedia.addEventListener("change", function (e) {
    if (!e.matches) closeMenu();
  });

  // Active-section highlighting for in-page anchor links (Office/Archive/About).
  var anchorLinks = document.querySelectorAll(
    '.main-nav a[href^="#"], .mobile-nav a[href^="#"]'
  );
  if (!anchorLinks.length || !("IntersectionObserver" in window)) return;

  var linksByTarget = {};
  anchorLinks.forEach(function (link) {
    var id = link.getAttribute("href").slice(1);
    if (!linksByTarget[id]) linksByTarget[id] = [];
    linksByTarget[id].push(link);
  });

  function setActive(id) {
    anchorLinks.forEach(function (link) {
      link.classList.toggle("is-active", link.getAttribute("href") === "#" + id);
    });
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );

  Object.keys(linksByTarget).forEach(function (id) {
    var section = document.getElementById(id);
    if (section) observer.observe(section);
  });
})();
