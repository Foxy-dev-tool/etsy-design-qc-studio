const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function benchmarkSQL() {
  try {
    await client.connect();

    // Test 1: Simple Order + Product Query
    console.time('Order + Product');
    const res1 = await client.query(`
      SELECT o.id, o."orderCode", o."createdAt", o."customerName", o."customerNote", o.note,
             p.name, p.quantity, p.sku, p.personalization, p.description, p.mockup_note, p."imgSrc"
      FROM public."order" o
      LEFT JOIN public.product p ON p."orderId" = o.id
      ORDER BY o.id DESC
      LIMIT 1000
    `);
    console.timeEnd('Order + Product');
    console.log(`Test 1 rows: ${res1.rows.length}`);

    // Test 2: Optimized Query with Simple Left Joins
    console.time('Optimized Full Join');
    const res2 = await client.query(`
      SELECT DISTINCT ON (o.id)
        o.id,
        o."orderCode" as order_number,
        o."createdAt" as created_at,
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
        COALESCE(o.drive_link, '') as drive_link
      FROM public."order" o
      LEFT JOIN public.product p ON p."orderId" = o.id
      LEFT JOIN public.qc_orders q ON q.id = ('pg-' || o.id::text)
      ORDER BY o.id DESC
      LIMIT 1000
    `);
    console.timeEnd('Optimized Full Join');
    console.log(`Test 2 rows: ${res2.rows.length}`);

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

benchmarkSQL();
