import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.TYPEORM_HOST || '103.75.184.164',
  port: Number(process.env.TYPEORM_PORT) || 5432,
  user: process.env.TYPEORM_USERNAME || 'postgres',
  password: process.env.TYPEORM_PASSWORD || '123456a@',
  database: process.env.TYPEORM_DATABASE || 'order_sync_db_dev',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Query REAL live orders directly from PostgreSQL order_info table joined with qc_orders, design_file, and sku_note
      const queryRes = await pool.query(`
        SELECT 
          o.id,
          o."orderId" as order_number,
          o."orderDate" as order_date,
          o."shopName" as store_name,
          o."buyerName" as customer_name,
          o.title as product_title,
          o.quantity,
          o.skus as sku,
          q.product_group,
          q.has_uploaded_design,
          q.uploaded_design_file,
          q.design_image,
          q.design_width,
          q.design_height,
          q.ratio_status,
          q.ai_status,
          q.ai_score,
          q.status,
          q.personalization_size,
          q.personalization_text,
          d.drive_link,
          s.text as sku_note
        FROM public.order_info o
        LEFT JOIN public.qc_orders q ON q.id = ('pg-' || o.id::text)
        LEFT JOIN public.design_file d ON d.sku = o.skus
        LEFT JOIN public.sku_note s ON s.sku = o.skus
        ORDER BY o.id DESC
      `);

      const orders = queryRes.rows.map(row => ({
        id: `pg-${row.id}`,
        orderDate: row.order_date || '',
        storeName: row.store_name || 'Etsy Shop',
        customerName: row.customer_name || '',
        storeIcon: 'Etsy',
        orderNumber: row.order_number || `#${row.id}`,
        productTitle: row.product_title || '',
        productGroup: row.product_group || 'Stained Glass Suncatcher',
        quantity: Number(row.quantity) || 1,
        sku: row.sku || '',
        personalization: {
          size: row.personalization_size || '',
          text: row.personalization_text || ''
        },
        note: '-',
        skuNote: row.sku_note || '-',
        driveLink: row.drive_link || '',
        hasUploadedDesign: row.has_uploaded_design || false,
        uploadedDesignFile: row.uploaded_design_file || null,
        designImage: row.design_image || null,
        designWidth: row.design_width || null,
        designHeight: row.design_height || null,
        designAspectRatio: row.design_width && row.design_height ? row.design_width / row.design_height : null,
        targetSizeLabel: '',
        targetWidth: null,
        targetHeight: null,
        ratioStatus: row.ratio_status || 'NEEDS_CHECK',
        aiStatus: row.ai_status || 'NEEDS_SCAN',
        aiScore: row.ai_score || null,
        status: row.status || 'Chờ kiểm tra',
        mockupThumb: '/_4123920413.png',
        assignee: 'Dakuho (QC SP)'
      }));

      return res.status(200).json({ success: true, count: orders.length, data: orders });
    }

    if (req.method === 'PUT') {
      const { orderId, fields } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Missing orderId' });
      }

      // Upsert order QC status and design image into qc_orders table
      const sql = `
        INSERT INTO public.qc_orders (
          id, order_number, product_group, status, ratio_status, ai_status,
          has_uploaded_design, uploaded_design_file, design_image, design_width, design_height, updated_at
        ) VALUES (
          $1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          product_group = COALESCE(EXCLUDED.product_group, qc_orders.product_group),
          status = COALESCE(EXCLUDED.status, qc_orders.status),
          ratio_status = COALESCE(EXCLUDED.ratio_status, qc_orders.ratio_status),
          ai_status = COALESCE(EXCLUDED.ai_status, qc_orders.ai_status),
          has_uploaded_design = COALESCE(EXCLUDED.has_uploaded_design, qc_orders.has_uploaded_design),
          uploaded_design_file = COALESCE(EXCLUDED.uploaded_design_file, qc_orders.uploaded_design_file),
          design_image = COALESCE(EXCLUDED.design_image, qc_orders.design_image),
          design_width = COALESCE(EXCLUDED.design_width, qc_orders.design_width),
          design_height = COALESCE(EXCLUDED.design_height, qc_orders.design_height),
          updated_at = NOW();
      `;

      await pool.query(sql, [
        orderId,
        fields.productGroup || 'Stained Glass Suncatcher',
        fields.status || 'Chờ kiểm tra',
        fields.ratioStatus || 'NEEDS_CHECK',
        fields.aiStatus || 'NEEDS_SCAN',
        fields.hasUploadedDesign || false,
        fields.uploadedDesignFile || null,
        fields.designImage || null,
        fields.designWidth || null,
        fields.designHeight || null
      ]);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (err) {
    console.error('PostgreSQL API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
