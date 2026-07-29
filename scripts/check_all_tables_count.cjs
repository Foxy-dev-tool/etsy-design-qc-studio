const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function checkAllTables() {
  try {
    await client.connect();
    console.log('⚡ Connected to PostgreSQL order_sync_db_dev');

    // List all tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log(`Found ${tablesRes.rows.length} tables in public schema.`);

    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      try {
        const countRes = await client.query(`SELECT COUNT(*) FROM public."${tableName}"`);
        console.log(`Table "${tableName}": ${countRes.rows[0].count} rows`);
      } catch (err) {
        console.log(`Table "${tableName}": Error (${err.message})`);
      }
    }

    await client.end();
  } catch (err) {
    console.error('Database Error:', err);
  }
}

checkAllTables();
