const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function initDB() {
  try {
    await client.connect();
    console.log('⚡ Connected to PostgreSQL: 103.75.184.164:5432 / order_sync_db_dev');

    // Create qc_orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.qc_orders (
        id TEXT PRIMARY KEY,
        order_number TEXT NOT NULL,
        order_date TEXT,
        store_name TEXT,
        customer_name TEXT,
        product_title TEXT,
        product_group TEXT DEFAULT 'Stained Glass Suncatcher',
        quantity INTEGER DEFAULT 1,
        sku TEXT,
        personalization_size TEXT,
        personalization_text TEXT,
        note TEXT,
        sku_note TEXT,
        drive_link TEXT,
        has_uploaded_design BOOLEAN DEFAULT FALSE,
        uploaded_design_file TEXT,
        design_image TEXT,
        design_width INTEGER,
        design_height INTEGER,
        design_aspect_ratio NUMERIC,
        target_size_label TEXT,
        target_width INTEGER,
        target_height INTEGER,
        ratio_status TEXT DEFAULT 'NEEDS_CHECK',
        ai_status TEXT DEFAULT 'NEEDS_SCAN',
        ai_score INTEGER,
        ai_report JSONB,
        status TEXT DEFAULT 'Chờ kiểm tra',
        mockup_thumb TEXT,
        assignee TEXT DEFAULT 'Dakuho (QC SP)',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    // Create qc_product_groups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.qc_product_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        base_mockup TEXT,
        tolerance_percent NUMERIC DEFAULT 1.5,
        min_dpi INTEGER DEFAULT 300,
        ai_rules_prompt TEXT,
        templates JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);

    console.log('✅ Tables public.qc_orders & public.qc_product_groups created successfully!');

    await client.end();
  } catch (err) {
    console.error('❌ Error initializing PostgreSQL tables:', err);
  }
}

initDB();
