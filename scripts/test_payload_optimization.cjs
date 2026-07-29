const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

function parseSize(descriptionText, personalizationText) {
  const fullText = (descriptionText || '') + ' ' + (personalizationText || '');
  const match = fullText.match(/(\d+(?:\.\d+)?\s*(?:in|inch|inches|cm|X\d+cm|x\d+cm|\d+x\d+|\d+\*\d+))/i);
  return match ? match[1].trim() : '';
}

function formatFullDateTime(createdAt) {
  if (!createdAt) return '';
  try {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${mins}`;
    }
  } catch (e) {}
  return createdAt;
}

function autoMatchGroup(title = '', sku = '') {
  const text = (title + ' ' + sku).toLowerCase();
  if (text.includes('desk mat')) return 'Desk Mat';
  if (text.includes('graduation cap') || text.includes('cap topper')) return 'Graduation Cap';
  if (text.includes('stole')) return 'Stole';
  if (text.includes('2 layer') && (text.includes('square') || text.includes('4'))) return '2 layer Wooden 4';
  if (text.includes('2 layer')) return '2 layer Wooden 2';
  if (text.includes('1 layer') || text.includes('wooden sign') || text.includes('wood sign') || text.includes('door hanger')) return '1 layer wooden';
  if (text.includes('acrylic suncatcher') || text.includes('1 layer suncatcher')) return 'Arylic Suncatcher';
  return 'Stained Glass Suncatcher';
}

async function testPayloadOptimization() {
  try {
    await client.connect();
    console.log('⚡ Connected to PostgreSQL');

    const sql = `
      SELECT DISTINCT ON (o.id)
        o.id,
        o."orderCode" as order_number,
        o."createdAt" as created_at,
        o."customerName" as customer_name,
        o."customerNote" as customer_note,
        o.note as order_note,
        COALESCE(p.name, '') as product_title,
        COALESCE(p.quantity, 1) as quantity,
        COALESCE(p.sku, '') as sku,
        p.personalization as personalization_raw,
        p.description as description_raw,
        p.mockup_note as product_mockup_note,
        p."imgSrc" as mockup_thumb,
        q.product_group,
        q.has_uploaded_design,
        q.uploaded_design_file,
        q.design_image,
        q.design_width,
        q.design_height,
        q.ratio_status,
        q.ai_status,
        q.ai_score,
        q.status as qc_status,
        COALESCE(o.drive_link, d.drive_link, '') as drive_link,
        s.text as sku_note
      FROM public."order" o
      LEFT JOIN public.product p ON p."orderId" = o.id
      LEFT JOIN public.qc_orders q ON q.id = ('pg-' || o.id::text)
      LEFT JOIN (
        SELECT sku, MAX(drive_link) as drive_link FROM public.design_file GROUP BY sku
      ) d ON d.sku = p.sku
      LEFT JOIN (
        SELECT sku, MAX(text) as text FROM public.sku_note GROUP BY sku
      ) s ON s.sku = p.sku
      ORDER BY o.id DESC
    `;

    const start = Date.now();
    const queryRes = await client.query(sql);
    console.log(`Query time for ALL ${queryRes.rows.length} rows: ${Date.now() - start} ms`);

    const orders = queryRes.rows.map(row => {
      const parsedSize = parseSize(row.description_raw, row.personalization_raw);
      const fullDateTime = formatFullDateTime(row.created_at);

      const personalizationParts = [];
      if (row.personalization_raw && row.personalization_raw.trim()) {
        personalizationParts.push(row.personalization_raw.trim());
      }
      if (row.customer_note && row.customer_note.trim()) {
        personalizationParts.push(`Customer Note: ${row.customer_note.trim()}`);
      }
      if (row.product_mockup_note && row.product_mockup_note.trim()) {
        personalizationParts.push(`Product Note: ${row.product_mockup_note.trim()}`);
      }

      const combinedPersonalizationText = personalizationParts.join('\n---\n');
      const matchedGroup = row.product_group || autoMatchGroup(row.product_title, row.sku);

      return {
        id: `pg-${row.id}`,
        orderDate: fullDateTime,
        customerName: row.customer_name || '',
        orderNumber: row.order_number || `#${row.id}`,
        productTitle: row.product_title || '',
        productGroup: matchedGroup,
        quantity: Number(row.quantity) || 1,
        sku: row.sku || '',
        personalization: {
          size: parsedSize,
          text: combinedPersonalizationText || 'Yêu cầu khách không ghi'
        },
        note: row.product_mockup_note || row.customer_note || row.order_note || '-',
        skuNote: row.sku_note || '-',
        driveLink: row.drive_link || '',
        hasUploadedDesign: row.has_uploaded_design || false,
        uploadedDesignFile: row.uploaded_design_file || null,
        designImage: row.design_image || null,
        designWidth: row.design_width || null,
        designHeight: row.design_height || null,
        ratioStatus: row.ratio_status || 'NEEDS_CHECK',
        aiStatus: row.ai_status || 'NEEDS_SCAN',
        aiScore: row.ai_score || null,
        status: row.qc_status || 'Chờ kiểm tra',
        mockupThumb: row.mockup_thumb || '/_4123920413.png'
      };
    });

    const jsonStr = JSON.stringify({ success: true, count: orders.length, data: orders });
    console.log('Optimized ALL 11,553 orders JSON Payload Size:', jsonStr.length, 'bytes (', (jsonStr.length / (1024*1024)).toFixed(2), 'MB)');

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

testPayloadOptimization();
