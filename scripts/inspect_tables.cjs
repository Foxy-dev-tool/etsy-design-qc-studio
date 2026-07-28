const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function inspectOtherTables() {
  try {
    await client.connect();

    console.log('--- Inspecting mockup_order_items ---');
    const mockupRes = await client.query('SELECT * FROM public.mockup_order_items LIMIT 2');
    console.log(JSON.stringify(mockupRes.rows, null, 2));

    console.log('--- Inspecting design_file ---');
    const designRes = await client.query('SELECT * FROM public.design_file LIMIT 2');
    console.log(JSON.stringify(designRes.rows, null, 2));

    console.log('--- Inspecting sku_note ---');
    const skuRes = await client.query('SELECT * FROM public.sku_note LIMIT 2');
    console.log(JSON.stringify(skuRes.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

inspectOtherTables();
