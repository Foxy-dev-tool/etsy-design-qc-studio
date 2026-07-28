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
      // Fetch all orders from PostgreSQL
      const queryRes = await pool.query(`
        SELECT 
          id, order_number, order_date, store_name, customer_name, product_title,
          product_group, quantity, sku, personalization_size, personalization_text,
          note, sku_note, drive_link, has_uploaded_design, uploaded_design_file,
          design_image, design_width, design_height, design_aspect_ratio,
          target_size_label, target_width, target_height, ratio_status,
          ai_status, ai_score, status, mockup_thumb, assignee, ai_report
        FROM public.qc_orders
        ORDER BY created_at DESC
      `);

      const orders = queryRes.rows.map(row => ({
        id: row.id,
        orderDate: row.order_date,
        storeName: row.store_name,
        customerName: row.customer_name,
        storeIcon: 'Etsy',
        orderNumber: row.order_number,
        productTitle: row.product_title,
        productGroup: row.product_group,
        quantity: row.quantity,
        sku: row.sku,
        personalization: {
          size: row.personalization_size || '',
          text: row.personalization_text || ''
        },
        note: row.note,
        skuNote: row.sku_note,
        driveLink: row.drive_link,
        hasUploadedDesign: row.has_uploaded_design,
        uploadedDesignFile: row.uploaded_design_file,
        designImage: row.design_image,
        designWidth: row.design_width,
        designHeight: row.design_height,
        designAspectRatio: row.design_aspect_ratio,
        targetSizeLabel: row.target_size_label,
        targetWidth: row.target_width,
        targetHeight: row.target_height,
        ratioStatus: row.ratio_status,
        aiStatus: row.ai_status,
        aiScore: row.ai_score,
        aiReport: row.ai_report,
        status: row.status,
        mockupThumb: row.mockup_thumb,
        assignee: row.assignee
      }));

      return res.status(200).json({ success: true, count: orders.length, data: orders });
    }

    if (req.method === 'PUT') {
      const { orderId, fields } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Missing orderId' });
      }

      const updates = [];
      const values = [orderId];
      let paramIdx = 2;

      if (fields.productGroup !== undefined) {
        updates.push(`product_group = $${paramIdx++}`);
        values.push(fields.productGroup);
      }
      if (fields.status !== undefined) {
        updates.push(`status = $${paramIdx++}`);
        values.push(fields.status);
      }
      if (fields.ratioStatus !== undefined) {
        updates.push(`ratio_status = $${paramIdx++}`);
        values.push(fields.ratioStatus);
      }
      if (fields.aiStatus !== undefined) {
        updates.push(`ai_status = $${paramIdx++}`);
        values.push(fields.aiStatus);
      }
      if (fields.hasUploadedDesign !== undefined) {
        updates.push(`has_uploaded_design = $${paramIdx++}`);
        values.push(fields.hasUploadedDesign);
      }
      if (fields.uploadedDesignFile !== undefined) {
        updates.push(`uploaded_design_file = $${paramIdx++}`);
        values.push(fields.uploadedDesignFile);
      }
      if (fields.designImage !== undefined) {
        updates.push(`design_image = $${paramIdx++}`);
        values.push(fields.designImage);
      }
      if (fields.designWidth !== undefined) {
        updates.push(`design_width = $${paramIdx++}`);
        values.push(fields.designWidth);
      }
      if (fields.designHeight !== undefined) {
        updates.push(`design_height = $${paramIdx++}`);
        values.push(fields.designHeight);
      }

      updates.push(`updated_at = NOW()`);

      if (updates.length > 1) {
        const sql = `UPDATE public.qc_orders SET ${updates.join(', ')} WHERE id = $1`;
        await pool.query(sql, values);
      }

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (err) {
    console.error('PostgreSQL API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
