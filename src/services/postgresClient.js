// PostgreSQL Direct API Client Service

export const isPostgresConfigured = true;

const VERCEL_API_URL = 'https://etsy-design-qc-studio.vercel.app/api/orders';

// Fetch all orders from PostgreSQL DB via /api/orders (with fallback to production Vercel URL for local dev)
export const fetchOrdersFromPostgres = async () => {
  let response = null;
  try {
    // 1. Try relative endpoint /api/orders first
    response = await fetch('/api/orders');
    if (!response.ok) {
      // 2. If relative failed (e.g. running on Vite local dev without backend), fallback to Vercel API
      response = await fetch(VERCEL_API_URL);
    }
  } catch (err) {
    try {
      // 3. Network fallback to Vercel production API endpoint
      response = await fetch(VERCEL_API_URL);
    } catch (e) {
      console.warn('Lỗi kết nối API PostgreSQL:', e);
      return null;
    }
  }

  if (response && response.ok) {
    try {
      const json = await response.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data;
      }
    } catch (e) {
      console.error('Lỗi parse JSON từ API:', e);
    }
  }
  return null;
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
      response = await fetch(VERCEL_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
    return response.ok;
  } catch (err) {
    try {
      const response = await fetch(VERCEL_API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (e) {
      console.warn('Lỗi lưu order vào PostgreSQL:', e);
      return false;
    }
  }
};
