const CART_STORAGE_KEY = "velfontCart";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

function addToCart(productId, size, qty = 1) {
  const items = loadCart();
  const existing = items.find((i) => i.productId === productId && i.size === size);

  if (existing) {
    existing.qty += qty;
  } else {
    items.push({ productId, size, qty });
  }

  saveCart(items);
  renderCartDrawer();
}

function setCartItemQty(productId, size, qty) {
  let items = loadCart();

  if (qty <= 0) {
    items = items.filter((i) => !(i.productId === productId && i.size === size));
  } else {
    const item = items.find((i) => i.productId === productId && i.size === size);
    if (item) item.qty = qty;
  }

  saveCart(items);
  renderCartDrawer();
}

function getCartCount() {
  return loadCart().reduce((sum, i) => sum + i.qty, 0);
}

function getCartSubtotal() {
  return loadCart().reduce((sum, i) => {
    const product = getProductById(i.productId);
    return sum + (product ? product.price * i.qty : 0);
  }, 0);
}

function renderCartDrawer() {
  const itemsEl = document.getElementById("cartDrawerItems");
  const subtotalEl = document.getElementById("cartSubtotal");
  const cartCountEl = document.getElementById("cartCount");
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (!itemsEl) return;

  const items = loadCart();

  itemsEl.innerHTML = items.length
    ? items
        .map((i) => {
          const product = getProductById(i.productId);
          if (!product) return "";
          return `
            <div class="cart-item" data-id="${i.productId}" data-size="${i.size}">
              <div class="cart-item-image">
                ${product.thumbnail ? `<img src="${resolveImageUrl(product.thumbnail)}" alt="${product.name}">` : ""}
              </div>
              <div class="cart-item-info">
                <div class="cart-item-name">${product.name}</div>
                <div class="cart-item-size">사이즈: ${i.size}</div>
                <div class="cart-item-qty">
                  <button type="button" class="qty-btn qty-minus" aria-label="수량 감소">-</button>
                  <span class="qty-value">${i.qty}</span>
                  <button type="button" class="qty-btn qty-plus" aria-label="수량 증가">+</button>
                </div>
                <div class="cart-item-price">${formatPrice(product.price * i.qty)}</div>
              </div>
              <button type="button" class="cart-item-remove" aria-label="삭제">
                <svg viewBox="0 0 24 24"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
              </button>
            </div>`;
        })
        .join("")
    : `<p class="cart-empty">장바구니가 비어 있습니다.</p>`;

  if (subtotalEl) subtotalEl.textContent = formatPrice(getCartSubtotal());
  if (cartCountEl) cartCountEl.textContent = getCartCount();
  if (checkoutBtn) checkoutBtn.disabled = items.length === 0;
}

function openCartDrawer() {
  document.getElementById("cartNavItem")?.classList.add("open");
}

function closeCartDrawer() {
  document.getElementById("cartNavItem")?.classList.remove("open");
}

function setupNav() {
  const navToggle = document.getElementById("navToggle");
  const mainNav = document.getElementById("mainNav");
  navToggle?.addEventListener("click", () => {
    mainNav?.classList.toggle("open");
  });

  const allNavItem = document.getElementById("allNavItem");
  const allToggle = document.getElementById("allToggle");
  if (!allNavItem || !allToggle) return;

  function closeAllDropdown() {
    allNavItem.classList.remove("open");
    allToggle.setAttribute("aria-expanded", "false");
  }

  allToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = allNavItem.classList.toggle("open");
    allToggle.setAttribute("aria-expanded", String(isOpen));
  });

  document.addEventListener("click", (e) => {
    if (!allNavItem.contains(e.target)) closeAllDropdown();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllDropdown();
  });
}

function setupSearch() {
  const searchToggle = document.getElementById("searchToggle");
  const searchBar = document.getElementById("searchBar");
  if (!searchToggle || !searchBar) return;

  searchToggle.addEventListener("click", () => {
    searchBar.classList.toggle("open");
    if (searchBar.classList.contains("open")) {
      searchBar.querySelector("input").focus();
    }
  });
}

function setupCartDrawer() {
  const cartNavItem = document.getElementById("cartNavItem");
  const cartBtn = document.getElementById("cartBtn");
  const drawer = document.getElementById("cartDrawer");
  const itemsEl = document.getElementById("cartDrawerItems");
  const checkoutBtn = document.getElementById("checkoutBtn");
  if (!drawer) return;

  cartBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    cartNavItem?.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (cartNavItem && !cartNavItem.contains(e.target)) closeCartDrawer();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeCartDrawer();
  });

  itemsEl.addEventListener("click", (e) => {
    const itemEl = e.target.closest(".cart-item");
    if (!itemEl) return;

    const id = Number(itemEl.dataset.id);
    const size = itemEl.dataset.size;
    const items = loadCart();
    const item = items.find((i) => i.productId === id && i.size === size);
    if (!item) return;

    if (e.target.closest(".qty-plus")) {
      setCartItemQty(id, size, item.qty + 1);
    } else if (e.target.closest(".qty-minus")) {
      setCartItemQty(id, size, item.qty - 1);
    } else if (e.target.closest(".cart-item-remove")) {
      setCartItemQty(id, size, 0);
    }
  });

  checkoutBtn?.addEventListener("click", () => {
    if (getCartCount() > 0) {
      window.location.href = "checkout.html";
    }
  });

  renderCartDrawer();
}

function setupNewsletter() {
  const form = document.getElementById("newsletterForm");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector("input");
    if (input.value) {
      alert("구독해주셔서 감사합니다.");
      input.value = "";
    }
  });
}

const LOGIN_STORAGE_KEY = "velfontLoggedIn";

function isLoggedIn() {
  return localStorage.getItem(LOGIN_STORAGE_KEY) === "true";
}

function renderAccountButton() {
  const btn = document.getElementById("accountBtn");
  if (!btn) return;
  btn.textContent = isLoggedIn() ? "profile" : "login";
}

function setupLoginModal() {
  const accountBtn = document.getElementById("accountBtn");
  const overlay = document.getElementById("loginOverlay");
  const modal = document.getElementById("loginModal");
  const closeBtn = document.getElementById("loginModalClose");
  const form = document.getElementById("loginForm");
  const googleBtn = document.getElementById("googleLoginBtn");
  if (!accountBtn || !modal) return;

  function openLoginModal() {
    if (isLoggedIn()) return;
    overlay.classList.add("open");
    modal.classList.add("open");
    document.getElementById("loginEmail")?.focus();
  }

  function closeLoginModal() {
    overlay.classList.remove("open");
    modal.classList.remove("open");
  }

  function logIn() {
    localStorage.setItem(LOGIN_STORAGE_KEY, "true");
    renderAccountButton();
    closeLoginModal();
  }

  accountBtn.addEventListener("click", openLoginModal);
  closeBtn?.addEventListener("click", closeLoginModal);
  overlay?.addEventListener("click", closeLoginModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLoginModal();
  });

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    logIn();
  });

  googleBtn?.addEventListener("click", () => {
    logIn();
  });
}

function revealPageVeil() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.add("is-entered");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupSearch();
  setupNewsletter();
  renderAccountButton();
  setupLoginModal();
  revealPageVeil();
});

document.addEventListener("DOMContentLoaded", async () => {
  await productsReady;
  setupCartDrawer();
});
