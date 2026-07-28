const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function deepInspect() {
  try {
    await client.connect();
    console.log('⚡ Connected to PostgreSQL order_sync_db_dev');

    // 1. Check exact unique order count in order_info
    const countRes = await client.query('SELECT COUNT(DISTINCT id) FROM public.order_info');
    console.log('Exact DISTINCT order count in order_info:', countRes.rows[0].count);

    // 2. Inspect all columns of order_info
    const colsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'order_info'");
    console.log('ALL order_info columns:', colsRes.rows.map(r => r.column_name).join(', '));

    // 3. Inspect a sample row from order_info in full detail
    const sampleRes = await client.query('SELECT * FROM public.order_info ORDER BY id DESC LIMIT 1');
    console.log('Sample full order_info row:\n', JSON.stringify(sampleRes.rows[0], null, 2));

    // 4. Check if product or mockup_image or listing_... tables have images
    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND (table_name LIKE '%product%' OR table_name LIKE '%mockup%' OR table_name LIKE '%image%')");
    console.log('Image-related tables:', tablesRes.rows.map(r => r.table_name));

    // 5. Inspect product table if exists
    const prodCols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'product'");
    console.log('product table columns:', prodCols.rows.map(r => r.column_name).join(', '));

    const prodSample = await client.query('SELECT * FROM public.product LIMIT 2');
    console.log('product sample rows:\n', JSON.stringify(prodSample.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

deepInspect();
