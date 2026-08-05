function badgeFor(product) {
  if (product.status === "sold_out") return '<span class="badge">Sold Out</span>';
  if (product.status === "coming_soon") return '<span class="badge">Coming Soon</span>';
  return "";
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const itemCount = document.getElementById("itemCount");
  const products = getProducts();

  if (getProductsLoadError()) {
    grid.innerHTML = `<p class="cart-empty">상품을 불러오지 못했습니다.</p>`;
    itemCount.textContent = "";
    return;
  }

  if (!products.length) {
    grid.innerHTML = `<p class="cart-empty">등록된 상품이 없습니다.</p>`;
    itemCount.textContent = "전체 0개 상품";
    return;
  }

  grid.innerHTML = products
    .map((p) => {
      const soldOut = p.status === "sold_out";
      const img = p.thumbnail ? `<img src="${resolveImageUrl(p.thumbnail)}" alt="${p.name}">` : "";

      return `
        <a class="product-card" href="product.html?slug=${p.slug}">
          <div class="product-image">
            <div class="product-visual${soldOut ? " sold-out" : ""}">${img}</div>
            ${badgeFor(p)}
          </div>
          <div class="product-info">
            <div class="name">${p.name}</div>
            <div class="colors">${p.color}</div>
            ${soldOut ? '<div class="sold-out-label">품절</div>' : `<div class="price"><span>${formatPrice(p.price)}</span></div>`}
          </div>
        </a>
      `;
    })
    .join("");

  itemCount.textContent = `전체 ${products.length}개 상품`;
}

function sortProducts(order) {
  const products = getProducts();

  if (order === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (order === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  } else if (order === "new") {
    products.reverse();
  }

  renderProducts();
}

function setupSort() {
  const sortSelect = document.getElementById("sortSelect");
  sortSelect.addEventListener("change", (e) => sortProducts(e.target.value));
}

/**
 * Promo Banner — Idle Drift
 * The (zoomed-in, model-anchored — see .promo-banner-image-center in
 * style.css) photo drifts gently and continuously on its own. Bounds
 * are measured from the actual rendered box rather than hardcoded, so
 * the drift can never expose empty space around the (asymmetrically
 * anchored) image.
 */
function setupPromoBannerIdle() {
  const wrap = document.querySelector(".promo-banner-image");
  const img = wrap?.querySelector("img");
  if (!wrap || !img) return;

  // Must match the translate() in .promo-banner-image-center.
  const ANCHOR_X = 0.55;
  const ANCHOR_Y = 0.58;
  const IDLE_AMOUNT = 0.4; // fraction of the tighter safe bound per axis
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) return;

  let idleStart = null;

  function computeBounds() {
    const cr = wrap.getBoundingClientRect();
    const imgW = img.offsetWidth;
    const imgH = img.offsetHeight;
    const neutralLeft = cr.left + cr.width / 2 - ANCHOR_X * imgW;
    const neutralTop = cr.top + cr.height / 2 - ANCHOR_Y * imgH;
    return {
      maxX: cr.left - neutralLeft,
      minX: -(neutralLeft + imgW - (cr.left + cr.width)),
      maxY: cr.top - neutralTop,
      minY: -(neutralTop + imgH - (cr.top + cr.height)),
    };
  }

  function idleTick(timestamp) {
    if (idleStart === null) idleStart = timestamp;
    const t = (timestamp - idleStart) / 1000;
    const bounds = computeBounds();
    const ampX = Math.min(bounds.maxX, -bounds.minX) * IDLE_AMOUNT;
    const ampY = Math.min(bounds.maxY, -bounds.minY) * IDLE_AMOUNT;
    img.style.transform = `translate(${Math.sin((t * 2 * Math.PI) / 9) * ampX}px, ${
      Math.sin((t * 2 * Math.PI) / 7) * ampY
    }px)`;
    requestAnimationFrame(idleTick);
  }

  requestAnimationFrame(idleTick);
}

document.addEventListener("DOMContentLoaded", () => {
  setupPromoBannerIdle();
});

document.addEventListener("DOMContentLoaded", async () => {
  await productsReady;
  renderProducts();
  setupSort();
});
