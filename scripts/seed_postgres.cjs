const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

async function seedPostgres() {
  try {
    await client.connect();
    console.log('⚡ Connected to PostgreSQL 103.75.184.164:5432 / order_sync_db_dev');

    const ordersPath = path.join(__dirname, '../src/data/realOrders.json');
    const orders = JSON.parse(fs.readFileSync(ordersPath, 'utf-8'));

    console.log(`Seeding ${orders.length} real CSV orders to PostgreSQL qc_orders...`);

    const chunkSize = 200;
    let totalSeeded = 0;

    for (let i = 0; i < orders.length; i += chunkSize) {
      const chunk = orders.slice(i, i + chunkSize);
      
      const valueStrings = [];
      const queryParams = [];
      let paramIdx = 1;

      for (const ord of chunk) {
        valueStrings.push(`($${paramIdx}, $${paramIdx+1}, $${paramIdx+2}, $${paramIdx+3}, $${paramIdx+4}, $${paramIdx+5}, $${paramIdx+6}, $${paramIdx+7}, $${paramIdx+8}, $${paramIdx+9}, $${paramIdx+10}, $${paramIdx+11}, $${paramIdx+12}, $${paramIdx+13}, $${paramIdx+14}, $${paramIdx+15}, $${paramIdx+16}, $${paramIdx+17}, $${paramIdx+18}, $${paramIdx+19}, $${paramIdx+20}, $${paramIdx+21}, $${paramIdx+22}, $${paramIdx+23}, $${paramIdx+24}, $${paramIdx+25}, $${paramIdx+26}, $${paramIdx+27})`);
        
        queryParams.push(
          ord.id,
          ord.orderNumber,
          ord.orderDate || '',
          ord.storeName || '',
          ord.customerName || '',
          ord.productTitle || '',
          ord.productGroup || 'Stained Glass Suncatcher',
          ord.quantity || 1,
          ord.sku || '',
          ord.personalization?.size || '',
          ord.personalization?.text || '',
          ord.note || '-',
          ord.skuNote || '-',
          ord.driveLink || '',
          ord.hasUploadedDesign || false,
          ord.uploadedDesignFile || null,
          ord.designImage || null,
          ord.designWidth || null,
          ord.designHeight || null,
          ord.targetSizeLabel || '',
          ord.targetWidth || null,
          ord.targetHeight || null,
          ord.ratioStatus || 'NEEDS_CHECK',
          ord.aiStatus || 'NEEDS_SCAN',
          ord.status || 'Chờ kiểm tra',
          ord.mockupThumb || '',
          ord.assignee || 'Dakuho (QC SP)',
          JSON.stringify(ord.aiReport || null)
        );

        paramIdx += 28;
      }

      const sql = `
        INSERT INTO public.qc_orders (
          id, order_number, order_date, store_name, customer_name, product_title, product_group,
          quantity, sku, personalization_size, personalization_text, note, sku_note, drive_link,
          has_uploaded_design, uploaded_design_file, design_image, design_width, design_height,
          target_size_label, target_width, target_height, ratio_status, ai_status, status,
          mockup_thumb, assignee, ai_report
        ) VALUES ${valueStrings.join(', ')}
        ON CONFLICT (id) DO UPDATE SET
          product_group = EXCLUDED.product_group,
          status = EXCLUDED.status,
          ratio_status = EXCLUDED.ratio_status,
          has_uploaded_design = EXCLUDED.has_uploaded_design,
          uploaded_design_file = EXCLUDED.uploaded_design_file,
          design_image = EXCLUDED.design_image,
          design_width = EXCLUDED.design_width,
          design_height = EXCLUDED.design_height,
          updated_at = NOW();
      `;

      await client.query(sql, queryParams);
      totalSeeded += chunk.length;
      console.log(`  Seeded ${totalSeeded}/${orders.length} orders...`);
    }

    console.log(`✅ DONE! Successfully seeded ${totalSeeded} orders to PostgreSQL order_sync_db_dev!`);

    await client.end();
  } catch (err) {
    console.error('❌ Error seeding PostgreSQL:', err);
  }
}

seedPostgres();
