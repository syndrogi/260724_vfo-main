/**
 * VELFONT OFFICE — Labs / Scale
 * Click a header link or hero letter to select it — a Photoshop-style
 * free-transform box appears with a handle on each corner. Drag a
 * handle to resize proportionally around the element's center. Click
 * empty space, or the same element again, to deselect.
 *
 * Size persists after deselecting, and after the element is moved by
 * any other lab (letter-drag, Physics, Gravity) — translate/rotate/
 * scale are tracked as separate state (see js/transform.js) and always
 * composed together, so moving something never resets how big it is.
 */
(function () {
  if (typeof registerLab !== "function") return;

  var TARGET_SELECTOR = "header a, header button, .hero-content .letter";
  var MIN_SCALE = 0.3;
  var MAX_SCALE = 3;
  var CORNERS = ["nw", "ne", "sw", "se"];

  var active = false;
  var selected = null;
  var box = null;
  var syncRafId = null;

  var dragging = false;
  var dragCenter = { x: 0, y: 0 };
  var dragStartDist = 1;
  var dragStartScale = 1;

  function ensureBox() {
    if (box) return;
    box = document.createElement("div");
    box.className = "labs-scale-box";
    CORNERS.forEach(function (corner) {
      var handle = document.createElement("div");
      handle.className = "labs-scale-handle labs-scale-handle-" + corner;
      handle.addEventListener("pointerdown", function (e) {
        onHandleDown(e);
      });
      box.appendChild(handle);
    });
    document.body.appendChild(box);
  }

  function positionBox() {
    if (!selected || !box) return;
    var rect = selected.getBoundingClientRect();
    box.style.left = rect.left + "px";
    box.style.top = rect.top + "px";
    box.style.width = rect.width + "px";
    box.style.height = rect.height + "px";
  }

  function syncLoop() {
    if (!selected) return;
    positionBox();
    syncRafId = requestAnimationFrame(syncLoop);
  }

  function select(el) {
    if (selected === el) return;
    selected = el;

    if (syncRafId) cancelAnimationFrame(syncRafId);

    if (selected) {
      ensureBox();
      box.hidden = false;
      positionBox();
      syncRafId = requestAnimationFrame(syncLoop);
    } else if (box) {
      box.hidden = true;
    }
  }

  function onClick(e) {
    if (box && box.contains(e.target)) return;
    var el = e.target.closest(TARGET_SELECTOR);
    if (!el) {
      select(null);
      return;
    }
    e.preventDefault();
    select(selected === el ? null : el);
  }

  function onHandleDown(e) {
    if (!selected) return;
    e.preventDefault();
    e.stopPropagation();
    dragging = true;

    var rect = selected.getBoundingClientRect();
    dragCenter.x = rect.left + rect.width / 2;
    dragCenter.y = rect.top + rect.height / 2;
    dragStartDist = Math.max(1, Math.hypot(e.clientX - dragCenter.x, e.clientY - dragCenter.y));
    dragStartScale = window.labsTransform.get(selected).scale;

    window.addEventListener("pointermove", onHandleMove);
    window.addEventListener("pointerup", onHandleUp);
  }

  function onHandleMove(e) {
    if (!dragging || !selected) return;
    var dist = Math.max(1, Math.hypot(e.clientX - dragCenter.x, e.clientY - dragCenter.y));
    var scale = dragStartScale * (dist / dragStartDist);
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
    window.labsTransform.update(selected, { scale: scale });
    positionBox();
  }

  function onHandleUp() {
    dragging = false;
    window.removeEventListener("pointermove", onHandleMove);
    window.removeEventListener("pointerup", onHandleUp);
  }

  function enable() {
    active = true;
    document.body.classList.add("labs-scale-active");
    document.addEventListener("click", onClick);
  }

  function disable() {
    active = false;
    document.body.classList.remove("labs-scale-active");
    document.removeEventListener("click", onClick);
    select(null);
  }

  registerLab({
    id: "scale",
    title: "Scale",
    action: function () {
      if (active) disable();
      else enable();
    },
  });
})();
