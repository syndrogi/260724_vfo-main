/**
 * VELFONT OFFICE — Labs / Noise
 * Toggles a low-opacity animated black & white grain overlay. Draws a
 * small noise buffer and lets the browser scale it up (pixelated)
 * instead of generating full-resolution noise every frame.
 */
(function () {
  if (typeof registerLab !== "function") return;

  var SIZE = 96;
  var FRAME_MS = 90;

  var active = false;
  var canvas = null;
  var ctx = null;
  var rafId = null;
  var lastDraw = 0;

  function ensureCanvas() {
    if (canvas) return;
    canvas = document.createElement("canvas");
    canvas.className = "labs-noise-canvas";
    canvas.width = SIZE;
    canvas.height = SIZE;
    ctx = canvas.getContext("2d");
    document.body.appendChild(canvas);
  }

  function draw(timestamp) {
    if (!active) return;
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
    ensureCanvas();
    canvas.hidden = false;
    rafId = requestAnimationFrame(draw);
  }

  function disable() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (canvas) canvas.hidden = true;
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
