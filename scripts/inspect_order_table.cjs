const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function inspectOrderTable() {
  try {
    await client.connect();
    console.log('⚡ Connected to PostgreSQL order_sync_db_dev');

    // Count rows in "order"
    const orderCount = await client.query('SELECT COUNT(*) FROM public."order"');
    console.log('Total rows in public."order":', orderCount.rows[0].count);

    // Columns of "order"
    const colsRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'order'");
    console.log('ALL public."order" columns:', colsRes.rows.map(r => r.column_name).join(', '));

    // Sample rows from "order"
    const sampleRes = await client.query('SELECT * FROM public."order" ORDER BY id DESC LIMIT 2');
    console.log('Sample public."order" rows:\n', JSON.stringify(sampleRes.rows, null, 2));

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectOrderTable();
