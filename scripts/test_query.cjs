const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function testRealQuery() {
  try {
    await client.connect();
    console.log('⚡ Connected to PostgreSQL order_sync_db_dev');

    const sql = `
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
        d.drive_link,
        s.text as sku_note
      FROM public.order_info o
      LEFT JOIN public.qc_orders q ON q.id = ('pg-' || o.id::text)
      LEFT JOIN public.design_file d ON d.sku = o.skus
      LEFT JOIN public.sku_note s ON s.sku = o.skus
      ORDER BY o.id DESC
      LIMIT 5
    `;

    const res = await client.query(sql);
    console.log(`Queried ${res.rows.length} real live orders from DB:\n`, JSON.stringify(res.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error('Query Error:', err);
  }
}

testRealQuery();
