const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function testJoinAllOrders() {
  try {
    await client.connect();
    console.log('⚡ Connected to PostgreSQL order_sync_db_dev');

    const countRes = await client.query('SELECT COUNT(DISTINCT id) FROM public."order"');
    console.log('Total UNIQUE orders in public."order":', countRes.rows[0].count);

    const sql = `
      SELECT DISTINCT ON (o.id)
        o.id,
        o."orderCode" as order_number,
        o."createdAt" as created_at,
        o."updatedAt" as updated_at,
        o."customerName" as customer_name,
        o."customerNote" as customer_note,
        o.note as order_note,
        COALESCE(p.name, '') as product_title,
        COALESCE(p.quantity, 1) as quantity,
        COALESCE(p.sku, '') as sku,
        p.personalization as personalization_raw,
        p.description as description_raw,
        p.mockup_note as product_mockup_note,
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
        q.status as qc_status,
        COALESCE(o.drive_link, d.drive_link, '') as drive_link,
        s.text as sku_note
      FROM public."order" o
      LEFT JOIN public.product p ON p."orderId" = o.id
      LEFT JOIN public.qc_orders q ON q.id = ('pg-' || o.id::text)
      LEFT JOIN (
        SELECT sku, MAX(drive_link) as drive_link FROM public.design_file GROUP BY sku
      ) d ON d.sku = p.sku
      LEFT JOIN (
        SELECT sku, MAX(text) as text FROM public.sku_note GROUP BY sku
      ) s ON s.sku = p.sku
      ORDER BY o.id DESC
      LIMIT 5
    `;

    const res = await client.query(sql);
    console.log('Sample 5 orders from public."order":\n', JSON.stringify(res.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

testJoinAllOrders();
