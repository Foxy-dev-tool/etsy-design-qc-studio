const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function testJoinProduct() {
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
        COALESCE(p.name, o.title) as product_title,
        COALESCE(p.quantity, o.quantity::integer) as quantity,
        COALESCE(p.sku, o.skus) as sku,
        p.personalization,
        p.description,
        p."imgSrc" as mockup_thumb,
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
      LEFT JOIN public.product p ON p."orderId" = o.id
      LEFT JOIN public.qc_orders q ON q.id = ('pg-' || o.id::text)
      LEFT JOIN (
        SELECT sku, MAX(drive_link) as drive_link FROM public.design_file GROUP BY sku
      ) d ON d.sku = COALESCE(p.sku, o.skus)
      LEFT JOIN (
        SELECT sku, MAX(text) as text FROM public.sku_note GROUP BY sku
      ) s ON s.sku = COALESCE(p.sku, o.skus)
      ORDER BY o.id DESC
      LIMIT 10
    `;

    const res = await client.query(sql);
    console.log(`Queried ${res.rows.length} joined orders:\n`, JSON.stringify(res.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

testJoinProduct();
