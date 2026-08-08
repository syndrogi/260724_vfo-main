// Archive block data access — non-product editorial content (research
// scans, film stills, construction drawings, etc.) interleaved into the
// collection feed by js/shop.js. Mirrors the loadProducts()/productsReady
// pattern in js/products.js. Starts out empty on a fresh project; that's
// expected, not an error — the feed just renders products only until rows
// are added to archive_blocks.

let cachedArchiveBlocks = [];

async function loadArchiveBlocks() {
  const { data, error } = await supabaseClient
    .from("archive_blocks")
    .select("*")
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to load archive blocks from Supabase:", error.message);
    cachedArchiveBlocks = [];
    return cachedArchiveBlocks;
  }

  cachedArchiveBlocks = data ?? [];
  return cachedArchiveBlocks;
}

const archiveBlocksReady = loadArchiveBlocks();

function getArchiveBlocks() {
  return cachedArchiveBlocks;
}
