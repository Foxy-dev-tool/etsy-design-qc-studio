const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function inspectShops() {
  try {
    await client.connect();
    const colsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'shops'");
    console.log('shops columns:', colsRes.rows.map(r => r.column_name).join(', '));

    const sampleRes = await client.query('SELECT * FROM public.shops LIMIT 2');
    console.log('shops sample:\n', JSON.stringify(sampleRes.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

inspectShops();
