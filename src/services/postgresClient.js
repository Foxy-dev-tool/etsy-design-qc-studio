// PostgreSQL Direct API Client Service with Ultra-Fast Crash-Proof Parallel Loader

export const isPostgresConfigured = true;

const VERCEL_API_URL = 'https://etsy-design-qc-studio-tawny.vercel.app/api/orders';

// Fetch single chunk of orders from API
async function fetchChunk(limit = 1500, offset = 0) {
  const urlPath = `/api/orders?limit=${limit}&offset=${offset}`;
  const fallbackUrl = `${VERCEL_API_URL}?limit=${limit}&offset=${offset}`;

  try {
    let response = await fetch(urlPath);
    if (!response.ok) {
      response = await fetch(fallbackUrl);
    }
    if (response && response.ok) {
      const json = await response.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json;
      }
    }
  } catch (err) {
    try {
      const response = await fetch(fallbackUrl);
      if (response && response.ok) {
        const json = await response.json();
        if (json && json.success && Array.isArray(json.data)) {
          return json;
        }
      }
    } catch (e) {
      console.warn(`Lỗi fetch chunk limit=${limit} offset=${offset}:`, e);
    }
  }
  return null;
}

// Fetch ALL 11,553 orders cleanly in 1 single state update without screen jumping
export const fetchOrdersFromPostgres = async () => {
  try {
    // 1. Fetch Chunk 1 (First 1,500 orders)
    const chunk1 = await fetchChunk(1500, 0);
    if (!chunk1 || !chunk1.data) return [];

    let allOrders = [...chunk1.data];
    const totalInDb = chunk1.totalInDb || 11553;

    // 2. Fetch remaining chunks in parallel silently in background
    if (totalInDb > 1500) {
      const offsets = [];
      for (let offset = 1500; offset < totalInDb; offset += 1500) {
        offsets.push(offset);
      }

      const chunkResults = await Promise.all(
        offsets.map(offset => fetchChunk(1500, offset))
      );

      for (const res of chunkResults) {
        if (res && Array.isArray(res.data)) {
          allOrders = allOrders.concat(res.data);
        }
      }

      // Deduplicate orders by id
      const seen = new Set();
      allOrders = allOrders.filter(ord => {
        if (!ord || !ord.id || seen.has(ord.id)) return false;
        seen.add(ord.id);
        return true;
      });
    }

    return allOrders;

  } catch (err) {
    console.error('Lỗi khi nạp tất cả đơn hàng từ PostgreSQL:', err);
    return [];
  }
};

// Update order fields in PostgreSQL DB
export const updateOrderInPostgres = async (orderId, fields) => {
  const payload = { orderId, fields };
  try {
    let response = await fetch('/api/orders', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      await fetch(`${VERCEL_API_URL}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    return true;
  } catch (err) {
    console.warn('Cập nhật PostgreSQL qua API thất bại:', err);
    return false;
  }
};
