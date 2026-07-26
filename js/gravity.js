/**
 * VELFONT OFFICE — Gravity Toggle
 * Pressing the button pulls every header "button" (logo, nav links, the
 * Instagram icon, the mobile menu toggle, and the gravity button itself)
 * out of normal layout and hands them to Matter.js as falling bodies.
 * Pressing it again snaps everything back to its original CSS position.
 */
(function () {
  var toggleBtn = document.getElementById("gravityToggle");
  if (!toggleBtn || !window.Matter) return;

  var TARGET_SELECTOR =
    ".logo, .main-nav a, .social-icon, .menu-toggle, .gravity-toggle";

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
  var originalStyles = new WeakMap();

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

        originalStyles.set(el, el.getAttribute("style") || "");
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

    items.forEach(function (item) {
      var prevStyle = originalStyles.get(item.el);
      if (prevStyle) {
        item.el.setAttribute("style", prevStyle);
      } else {
        item.el.removeAttribute("style");
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
