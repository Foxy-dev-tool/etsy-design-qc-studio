const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function inspectDB() {
  try {
    await client.connect();
    console.log('⚡ Connected to PostgreSQL order_sync_db_dev');

    const countRes = await client.query('SELECT COUNT(*) FROM public.order_info');
    console.log('Total live rows in order_info:', countRes.rows[0].count);

    const sampleRes = await client.query('SELECT * FROM public.order_info ORDER BY id DESC LIMIT 3');
    console.log('Sample rows in order_info:\n', JSON.stringify(sampleRes.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectDB();
