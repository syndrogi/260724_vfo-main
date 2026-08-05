function renderCheckout() {
  const itemsEl = document.getElementById("checkoutItems");
  const totalEl = document.getElementById("checkoutTotal");
  const items = loadCart();

  if (!items.length) {
    itemsEl.innerHTML = `<p class="cart-empty">장바구니가 비어 있습니다. <a href="index.html">쇼핑 계속하기</a></p>`;
    totalEl.textContent = formatPrice(0);
    return;
  }

  itemsEl.innerHTML = items
    .map((i) => {
      const product = getProductById(i.productId);
      if (!product) return "";
      return `
        <div class="checkout-item">
          <div class="checkout-item-image">
            ${product.thumbnail ? `<img src="${resolveImageUrl(product.thumbnail)}" alt="${product.name}">` : ""}
          </div>
          <div class="checkout-item-info">
            <div class="checkout-item-name">${product.name}</div>
            <div class="checkout-item-meta">사이즈 ${i.size} · 수량 ${i.qty}</div>
          </div>
          <div class="checkout-item-price">${formatPrice(product.price * i.qty)}</div>
        </div>`;
    })
    .join("");

  totalEl.textContent = formatPrice(getCartSubtotal());
}

function setupCheckoutSubmit() {
  const btn = document.getElementById("checkoutSubmitBtn");
  btn.addEventListener("click", () => {
    if (getCartCount() === 0) {
      alert("장바구니가 비어 있습니다.");
      return;
    }
    alert("결제 연동은 준비 중입니다. PG 연동 후 이 버튼이 실제 결제를 진행합니다.");
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await productsReady;
  renderCheckout();
  setupCheckoutSubmit();
});
