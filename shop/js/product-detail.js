function getProductFromUrl() {
  const slug = new URLSearchParams(window.location.search).get("slug");
  return getProductBySlug(slug) || getProducts()[0];
}

function renderProductDetail(product) {
  if (!product) {
    document.getElementById("productDetail").innerHTML = `<p class="cart-empty">상품을 찾을 수 없습니다.</p>`;
    return;
  }

  document.title = `VELFONT OFFICE — ${product.name}`;
  document.getElementById("breadcrumbName").textContent = product.name;

  const images = product.thumbnail ? [resolveImageUrl(product.thumbnail)] : [];

  const soldOut = product.status === "sold_out";
  const soldOutClass = soldOut ? " sold-out" : "";
  const mainVisual = images.length
    ? `<div class="gallery-visual${soldOutClass}"><img id="mainImage" src="${images[0]}" alt="${product.name}"></div>`
    : `<div class="gallery-visual gallery-placeholder${soldOutClass}"></div>`;

  const thumbsHtml = images.length > 1
    ? `
      <div class="gallery-thumbs">
        ${images
          .map(
            (src, i) => `
          <button class="thumb${i === 0 ? " active" : ""}" data-src="${src}">
            <img src="${src}" alt="${product.name} 썸네일 ${i + 1}">
          </button>`
          )
          .join("")}
      </div>`
    : "";

  const colorOptions = product.color
    .split("/")
    .map((c) => c.trim())
    .map((c) => `<option value="${c}">${c}</option>`)
    .join("");

  const sizeOptions = product.size
    .split(",")
    .map((s) => s.trim())
    .map(
      (size) => `
      <button type="button" class="size-option" data-size="${size}"${soldOut ? " disabled" : ""}>${size}</button>`
    )
    .join("");

  const descriptionLines = (product.description || "").split("\n").filter(Boolean);
  const descriptionHtml = descriptionLines.map((line) => `<li>${line}</li>`).join("");

  const el = document.getElementById("productDetail");
  el.innerHTML = `
    <div class="product-gallery">
      <div class="gallery-main">
        ${mainVisual}
        ${soldOut ? '<span class="badge">Sold Out</span>' : ""}
      </div>
      ${thumbsHtml}
    </div>

    <div class="product-panel">
      <h1>${product.name}</h1>
      <div class="product-colors">${product.color}</div>
      <div class="product-price"><span>${formatPrice(product.price)}</span></div>

      ${descriptionHtml ? `<ul class="product-description">${descriptionHtml}</ul>` : ""}

      <div class="option-group">
        <label for="colorSelect">색상</label>
        <select id="colorSelect">${colorOptions}</select>
      </div>

      <div class="option-group">
        <div class="option-group-head">
          <label>사이즈</label>
          <a href="#sizeGuide" class="size-guide-link">사이즈 가이드</a>
        </div>
        <div class="size-options">${sizeOptions}</div>
      </div>

      ${
        soldOut
          ? `<button class="add-to-cart-btn" disabled>품절된 상품입니다</button>`
          : `<button class="add-to-cart-btn" id="addToCartBtn">장바구니 담기</button>`
      }

      <div class="accordion">
        <details open>
          <summary>구성/소재</summary>
          <div class="accordion-body">
            <p>Cotton 100%. 정확한 소재 정보는 상품 라벨을 참고해주세요.</p>
          </div>
        </details>
        <details id="sizeGuide">
          <summary>사이즈 가이드</summary>
          <div class="accordion-body">
            <table class="size-guide-table">
              <thead>
                <tr><th>사이즈</th><th>총장</th><th>가슴단면</th><th>어깨너비</th><th>소매길이</th></tr>
              </thead>
              <tbody>
                <tr><td>S</td><td>68</td><td>54</td><td>50</td><td>21</td></tr>
                <tr><td>M</td><td>70</td><td>57</td><td>52</td><td>22</td></tr>
                <tr><td>L</td><td>72</td><td>60</td><td>54</td><td>23</td></tr>
                <tr><td>XL</td><td>74</td><td>63</td><td>56</td><td>24</td></tr>
              </tbody>
            </table>
            <p class="size-guide-note">단위: cm / 측정 방법에 따라 1~2cm 오차가 있을 수 있습니다.</p>
          </div>
        </details>
        <details>
          <summary>케어 가이드</summary>
          <div class="accordion-body">
            <p>찬물에 단독 손세탁을 권장하며, 표백제 사용을 피하고 그늘에서 건조해주세요.</p>
          </div>
        </details>
      </div>
    </div>
  `;
}

function setupGallery() {
  const thumbs = document.querySelectorAll(".thumb");
  const mainImage = document.getElementById("mainImage");
  if (!thumbs.length || !mainImage) return;

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      mainImage.src = thumb.dataset.src;
      thumbs.forEach((t) => t.classList.remove("active"));
      thumb.classList.add("active");
    });
  });
}

function setupSizeOptions() {
  const options = document.querySelectorAll(".size-option:not([disabled])");
  options.forEach((btn) => {
    btn.addEventListener("click", () => {
      options.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function setupAddToCart(product) {
  const btn = document.getElementById("addToCartBtn");
  if (!btn) return;

  btn.addEventListener("click", (e) => {
    const selectedSize = document.querySelector(".size-option.active");
    if (!selectedSize) {
      alert("사이즈를 선택해주세요.");
      return;
    }
    e.stopPropagation();
    addToCart(product.id, selectedSize.dataset.size, 1);
    openCartDrawer();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await productsReady;
  const product = getProductFromUrl();
  renderProductDetail(product);
  setupGallery();
  setupSizeOptions();
  if (product) setupAddToCart(product);
});
