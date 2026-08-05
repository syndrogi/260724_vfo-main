// Product data access. Everything else (shop.js, product-detail.js,
// common.js, checkout.js) reads products through the functions below —
// none of them talk to Supabase directly.

const PRODUCTS_STORAGE_BUCKET = "products";

let cachedProducts = [];
let loadError = null;

async function loadProducts() {
  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load products from Supabase:", error.message);
    loadError = error;
    cachedProducts = [];
    return cachedProducts;
  }

  loadError = null;
  cachedProducts = data ?? [];
  return cachedProducts;
}

// Kicked off once, at parse time, so every page only ever pays for one
// fetch. Callers that need product data await this before touching the
// cache accessors below.
const productsReady = loadProducts();

function getProducts() {
  return cachedProducts;
}

function getProductsLoadError() {
  return loadError;
}

function getProductBySlug(slug) {
  return cachedProducts.find((p) => p.slug === slug);
}

function getProductById(id) {
  return cachedProducts.find((p) => p.id === id);
}

// Not wired to any UI yet — the shop has no filter bar today — but kept
// here so adding one later is a rendering change, not a data-layer one.
function filterProducts({ category, status, featured } = {}) {
  return cachedProducts.filter((p) => {
    if (category && p.category !== category) return false;
    if (status && p.status !== status) return false;
    if (featured !== undefined && p.featured !== featured) return false;
    return true;
  });
}

function resolveImageUrl(path) {
  if (!path) return "";
  return supabaseClient.storage.from(PRODUCTS_STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

function formatPrice(value) {
  return value.toLocaleString("ko-KR") + "원";
}
