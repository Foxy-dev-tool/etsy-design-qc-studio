// PostgreSQL Direct API Client Service

export const isPostgresConfigured = true;

const VERCEL_API_URL = 'https://etsy-design-qc-studio-tawny.vercel.app/api/orders';

// Fetch all orders from PostgreSQL DB via /api/orders
export const fetchOrdersFromPostgres = async (limit = 2500) => {
  let response = null;
  const endpoint = `/api/orders?limit=${limit}`;
  const fallbackEndpoint = `${VERCEL_API_URL}?limit=${limit}`;

  try {
    // 1. Try relative endpoint /api/orders first
    response = await fetch(endpoint);
    if (!response.ok) {
      // 2. If relative failed, fallback to Vercel production API endpoint
      response = await fetch(fallbackEndpoint);
    }
  } catch (err) {
    try {
      // 3. Network fallback to Vercel production API endpoint
      response = await fetch(fallbackEndpoint);
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
      console.warn('Lỗi cập nhật PostgreSQL DB:', e);
      return false;
    }
  }
};
