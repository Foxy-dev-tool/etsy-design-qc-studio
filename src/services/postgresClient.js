// PostgreSQL Direct API Client Service

export const isPostgresConfigured = true;

// Fetch all orders from PostgreSQL DB via /api/orders
export const fetchOrdersFromPostgres = async () => {
  try {
    const response = await fetch('/api/orders');
    if (!response.ok) return null;
    const json = await response.json();
    if (json && json.success && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (err) {
    console.warn('Lỗi kết nối API PostgreSQL:', err);
  }
  return null;
};

// Update order fields in PostgreSQL DB
export const updateOrderInPostgres = async (orderId, fields) => {
  try {
    const response = await fetch('/api/orders', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ orderId, fields })
    });
    return response.ok;
  } catch (err) {
    console.warn('Lỗi lưu order vào PostgreSQL:', err);
    return false;
  }
};
