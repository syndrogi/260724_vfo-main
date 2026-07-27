/**
 * VELFONT OFFICE — Labs / Noise
 * A TV-signal effect rather than a static texture: black & white grain
 * plus scanlines, where moving the pointer visibly "disturbs" the
 * signal (opacity spikes with cursor speed, decays when still), and
 * the picture randomly glitch-jumps every few seconds — like a set
 * with a loose antenna. Draws a small noise buffer and lets the
 * browser scale it up (pixelated) instead of generating
 * full-resolution noise every frame.
 */
(function () {
  if (typeof registerLab !== "function") return;

  var SIZE = 96;
  var FRAME_MS = 60;
  var BASE_OPACITY = 0.045;
  var MAX_EXCITEMENT = 0.22;
  var DECAY = 0.92;
  var GLITCH_MIN_MS = 2200;
  var GLITCH_MAX_MS = 5000;
  var GLITCH_DURATION_MS = 110;

  var active = false;
  var canvas = null;
  var ctx = null;
  var scanlines = null;
  var rafId = null;
  var lastDraw = 0;

  var lastMouseX = null;
  var lastMouseY = null;
  var lastMouseT = 0;
  var excitement = 0;

  var nextGlitchAt = 0;
  var glitchUntil = 0;

  function ensureLayers() {
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.className = "labs-noise-canvas";
    canvas.width = SIZE;
    canvas.height = SIZE;
    ctx = canvas.getContext("2d");
    document.body.appendChild(canvas);

    scanlines = document.createElement("div");
    scanlines.className = "labs-noise-scanlines";
    document.body.appendChild(scanlines);
  }

  function onMouseMove(e) {
    var now = performance.now();
    if (lastMouseX !== null) {
      var dt = Math.max(now - lastMouseT, 1);
      var dist = Math.hypot(e.clientX - lastMouseX, e.clientY - lastMouseY);
      var speed = dist / dt; // px per ms
      excitement = Math.min(MAX_EXCITEMENT, excitement + speed * 0.012);
    }
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    lastMouseT = now;
  }

  function scheduleNextGlitch(timestamp) {
    nextGlitchAt = timestamp + GLITCH_MIN_MS + Math.random() * (GLITCH_MAX_MS - GLITCH_MIN_MS);
  }

  function draw(timestamp) {
    if (!active) return;

    if (!nextGlitchAt) scheduleNextGlitch(timestamp);
    if (timestamp >= nextGlitchAt && timestamp > glitchUntil) {
      glitchUntil = timestamp + GLITCH_DURATION_MS;
      scheduleNextGlitch(timestamp);
    }

    var glitching = timestamp < glitchUntil;
    canvas.classList.toggle("is-glitching", glitching);
    scanlines.classList.toggle("is-glitching", glitching);

    excitement *= DECAY;
    var opacity = BASE_OPACITY + excitement + (glitching ? 0.12 : 0);
    canvas.style.opacity = Math.min(opacity, 0.4).toFixed(3);

    if (timestamp - lastDraw >= FRAME_MS) {
      lastDraw = timestamp;
      var imageData = ctx.createImageData(SIZE, SIZE);
      var buffer = imageData.data;
      for (var i = 0; i < buffer.length; i += 4) {
        var v = Math.random() * 255;
        buffer[i] = v;
        buffer[i + 1] = v;
        buffer[i + 2] = v;
        buffer[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    rafId = requestAnimationFrame(draw);
  }

  function enable() {
    active = true;
    ensureLayers();
    canvas.hidden = false;
    scanlines.hidden = false;
    excitement = 0;
    lastMouseX = null;
    nextGlitchAt = 0;
    glitchUntil = 0;
    window.addEventListener("mousemove", onMouseMove);
    rafId = requestAnimationFrame(draw);
  }

  function disable() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    window.removeEventListener("mousemove", onMouseMove);
    if (canvas) {
      canvas.hidden = true;
      canvas.classList.remove("is-glitching");
    }
    if (scanlines) {
      scanlines.hidden = true;
      scanlines.classList.remove("is-glitching");
    }
  }

  registerLab({
    id: "noise",
    title: "Noise",
    action: function () {
      if (active) disable();
      else enable();
    },
  });
})();
