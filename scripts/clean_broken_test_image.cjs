const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.TYPEORM_HOST || '103.75.184.164',
  port: parseInt(process.env.TYPEORM_PORT || '5432'),
  user: process.env.TYPEORM_USERNAME || 'postgres',
  password: process.env.TYPEORM_PASSWORD || '123456a@',
  database: process.env.TYPEORM_DATABASE || 'order_sync_db_dev',
  ssl: false
});

async function cleanBrokenTestImage() {
  try {
    console.log('⚡ Clearing test broken image for pg-11586 in PostgreSQL DB...');
    await pool.query(`
      UPDATE public.qc_orders
      SET design_image = NULL,
          uploaded_design_file = NULL,
          has_uploaded_design = false,
          design_width = NULL,
          design_height = NULL,
          status = 'Chờ kiểm tra',
          ratio_status = 'NEEDS_CHECK'
      WHERE id = 'pg-11586';
    `);
    console.log('✅ Successfully cleared test image for pg-11586!');
  } catch (err) {
    console.error('Error cleaning test image:', err);
  } finally {
    await pool.end();
  }
}

cleanBrokenTestImage();
