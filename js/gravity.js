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

  function startGravity() {
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

        originalState.set(el, {
          style: el.getAttribute("style") || "",
          parent: el.parentNode,
          nextSibling: el.nextSibling,
        });

        document.body.appendChild(el);
        el.style.position = "fixed";
        el.style.left = rect.left + "px";
        el.style.top = rect.top + "px";
        el.style.width = rect.width + "px";
        el.style.height = rect.height + "px";
        el.style.margin = "0";
        el.style.zIndex = "500";

        var body = Bodies.rectangle(cx, cy, rect.width, rect.height, {
          restitution: 0.45,
          friction: 0.4,
          frictionAir: 0.01,
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.15);
        Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: 0 });
        World.add(world, body);

        return { el: el, body: body, cx: cx, cy: cy };
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
    if (rafId) cancelAnimationFrame(rafId);
    if (runner) Runner.stop(runner);
    if (engine) Engine.clear(engine);

    // Restore back-to-front: each item's recorded nextSibling is only
    // guaranteed to already be back in state.parent (so insertBefore has
    // a valid reference node) once everything after it has been undone
    // first — items are captured in document order, so reversing that
    // order here rebuilds the original sequence correctly.
    items.slice().reverse().forEach(function (item) {
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
