/**
 * VELFONT OFFICE — Gravity Toggle
 * Pressing the button pulls every header button, hero letter, and hero
 * image out of normal layout and hands them to Matter.js as falling
 * bodies. Pressing it again snaps everything back to its original
 * place in the document.
 *
 * Targets are matched by tag/role inside `header` and `.hero-content`
 * (any a/button/img there, plus per-letter spans) rather than a fixed
 * list of classes, so new text or images dropped into those areas
 * later are picked up automatically.
 */
(function () {
  var toggleBtn = document.getElementById("gravityToggle");
  if (!toggleBtn || !window.Matter) return;

  var TARGET_SELECTOR = [
    "header a",
    "header button",
    ".hero-content .letter",
    ".hero-content img",
    ".gravity-toggle",
  ].join(", ");

  // Visual properties that only exist because of an ancestor (the big
  // hero-title font-size, for example) have to be baked in as inline
  // styles before an element is re-parented to <body> — once it's a
  // direct child of body it no longer inherits from .hero-title/etc.
  // `color` is deliberately excluded: baking it in as an inline style
  // would outrank the `.letter:hover`/`.nav-link:hover` CSS rules and
  // permanently kill the hover-red effect.
  var FONT_PROPS = [
    "fontSize",
    "fontWeight",
    "fontFamily",
    "letterSpacing",
    "lineHeight",
    "textTransform",
  ];

  var Engine = Matter.Engine;
  var World = Matter.World;
  var Bodies = Matter.Bodies;
  var Body = Matter.Body;
  var Runner = Matter.Runner;

  var active = false;
  var engine = null;
  var runner = null;
  var rafId = null;
  var items = [];
  // Every escape hatch needed to put an element back exactly where it
  // came from: its inline style, parent, and next sibling (re-parenting
  // to <body> is what lets position:fixed measure from the real
  // viewport instead of a transformed/animated ancestor's box).
  var originalState = new WeakMap();

  // Lets a settled or falling body be grabbed and dragged by the
  // pointer, same idea as the letter-drag in main.js but driving the
  // Matter.js body itself so it keeps colliding/resting correctly and
  // resumes falling under gravity on release.
  function attachBodyDrag(item) {
    var dragging = false;
    var offsetX = 0;
    var offsetY = 0;

    // Listen on window (not the element) once a drag starts, rather than
    // relying on setPointerCapture — the element can rotate/translate
    // out from under a fast pointer mid-drag, and capture shouldn't be
    // required just to keep tracking a held-down pointer's movement.
    function onDown(e) {
      dragging = true;
      Body.setStatic(item.body, true);
      offsetX = e.clientX - item.body.position.x;
      offsetY = e.clientY - item.body.position.y;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
    }

    function onMove(e) {
      Body.setPosition(item.body, {
        x: e.clientX - offsetX,
        y: e.clientY - offsetY,
      });
    }

    function onUp() {
      dragging = false;
      Body.setStatic(item.body, false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    }

    item.el.addEventListener("pointerdown", onDown);

    item.detachDrag = function () {
      item.el.removeEventListener("pointerdown", onDown);
      if (dragging) onUp();
    };
  }

  function startGravity() {
    window.__gravityActive = true;
    engine = Engine.create();
    var world = engine.world;

    var w = window.innerWidth;
    var h = window.innerHeight;

    World.add(world, [
      Bodies.rectangle(w / 2, h + 25, w * 2, 50, { isStatic: true }),
      Bodies.rectangle(-25, h / 2, 50, h * 2, { isStatic: true }),
      Bodies.rectangle(w + 25, h / 2, 50, h * 2, { isStatic: true }),
    ]);

    items = Array.prototype
      .slice
      .call(document.querySelectorAll(TARGET_SELECTOR))
      .filter(function (el) {
        var rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map(function (el) {
        var rect = el.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var computed = window.getComputedStyle(el);
        var fontStyles = {};
        FONT_PROPS.forEach(function (prop) {
          fontStyles[prop] = computed[prop];
        });

        originalState.set(el, {
          style: el.getAttribute("style") || "",
          parent: el.parentNode,
          nextSibling: el.nextSibling,
        });

        // Bake in the computed look before moving, so the element keeps
        // its exact size/weight/color once it's no longer inside
        // .hero-title, .main-nav, etc.
        FONT_PROPS.forEach(function (prop) {
          el.style[prop] = fontStyles[prop];
        });

        document.body.appendChild(el);
        el.style.position = "fixed";
        el.style.left = rect.left + "px";
        el.style.top = rect.top + "px";
        el.style.width = rect.width + "px";
        el.style.height = rect.height + "px";
        el.style.margin = "0";
        el.style.zIndex = "500";
        el.style.touchAction = "none";

        var body = Bodies.rectangle(cx, cy, rect.width, rect.height, {
          restitution: 0.45,
          friction: 0.4,
          frictionAir: 0.01,
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.15);
        Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: 0 });
        World.add(world, body);

        var item = { el: el, body: body, cx: cx, cy: cy };
        attachBodyDrag(item);
        return item;
      });

    runner = Runner.create();
    Runner.run(runner, engine);
    rafId = requestAnimationFrame(renderLoop);
  }

  function renderLoop() {
    items.forEach(function (item) {
      var pos = item.body.position;
      var dx = pos.x - item.cx;
      var dy = pos.y - item.cy;
      item.el.style.transform =
        "translate(" + dx + "px, " + dy + "px) rotate(" + item.body.angle + "rad)";
    });
    rafId = requestAnimationFrame(renderLoop);
  }

  function stopGravity() {
    window.__gravityActive = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (runner) Runner.stop(runner);
    if (engine) Engine.clear(engine);

    // Restore back-to-front: each item's recorded nextSibling is only
    // guaranteed to already be back in state.parent (so insertBefore has
    // a valid reference node) once everything after it has been undone
    // first — items are captured in document order, so reversing that
    // order here rebuilds the original sequence correctly.
    items.slice().reverse().forEach(function (item) {
      item.detachDrag();

      var state = originalState.get(item.el);
      if (!state) return;

      if (state.style) {
        item.el.setAttribute("style", state.style);
      } else {
        item.el.removeAttribute("style");
      }

      if (state.nextSibling && state.nextSibling.parentNode === state.parent) {
        state.parent.insertBefore(item.el, state.nextSibling);
      } else {
        state.parent.appendChild(item.el);
      }
    });

    items = [];
    engine = null;
    runner = null;
  }

  toggleBtn.addEventListener("click", function () {
    active = !active;
    toggleBtn.setAttribute("aria-pressed", String(active));

    if (active) {
      startGravity();
    } else {
      stopGravity();
    }
  });
})();
