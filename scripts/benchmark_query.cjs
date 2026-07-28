const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function benchmark() {
  try {
    const t0 = Date.now();
    await client.connect();
    console.log('Connected in:', Date.now() - t0, 'ms');

    const t1 = Date.now();
    const sql = `
      SELECT DISTINCT ON (o.id)
        o.id,
        o."orderId" as order_number,
        o."orderDate" as order_date,
        o."createdAt" as created_at,
        o."shopName" as store_name,
        o."buyerName" as customer_name,
        o."buyerEmail" as customer_email,
        o."giftMessage" as gift_message,
        COALESCE(p.name, o.title) as product_title,
        COALESCE(p.quantity, o.quantity::integer, 1) as quantity,
        COALESCE(p.sku, o.skus) as sku,
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
    `;

    const res = await client.query(sql);
    console.log('Query completed in:', Date.now() - t1, 'ms | Total rows returned:', res.rows.length);

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

benchmark();
