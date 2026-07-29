const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.TYPEORM_HOST || '103.75.184.164',
  port: parseInt(process.env.TYPEORM_PORT || '5432'),
  user: process.env.TYPEORM_USERNAME || 'postgres',
  password: process.env.TYPEORM_PASSWORD || '123456a@',
  database: process.env.TYPEORM_DATABASE || 'order_sync_db_dev',
  ssl: false
});

async function inspectOrderIds() {
  try {
    console.log('⚡ Inspecting public.order and public.qc_orders...');
    const orderRes = await pool.query('SELECT id, "orderCode" FROM public."order" LIMIT 5;');
    console.log('public.order rows:', orderRes.rows);

    const qcRes = await pool.query('SELECT id, order_number FROM public.qc_orders LIMIT 5;');
    console.log('public.qc_orders rows:', qcRes.rows);
  } catch (err) {
    console.error('Error querying:', err);
  } finally {
    await pool.end();
  }
}

inspectOrderIds();
