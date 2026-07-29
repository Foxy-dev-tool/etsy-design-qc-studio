import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.TYPEORM_HOST || '103.75.184.164',
  port: Number(process.env.TYPEORM_PORT) || 5432,
  user: process.env.TYPEORM_USERNAME || 'postgres',
  password: process.env.TYPEORM_PASSWORD || '123456a@',
  database: process.env.TYPEORM_DATABASE || 'order_sync_db_dev',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

// Strict Size Parser scanning ONLY customer personalization text
function parseSize(descriptionText, personalizationText) {
  const text = (personalizationText || '').trim();
  if (!text) return '';

  // 1. Explicit Size line e.g. "Size (inches): 8", "Size: 60" x 50"", "Size: 8x8", "Kích thước: 10 in"
  const lineMatch = text.match(/(?:Khách đặt Size|Select Size|Size\s*(?:\([^)]*\))?|size|Kích thước|Dimensions)\s*[:=]\s*([^\n\r,]+)/i);
  if (lineMatch && lineMatch[1] && lineMatch[1].trim()) {
    let cand = lineMatch[1].trim();
    if (!cand.toLowerCase().startsWith('1 layer') && !cand.toLowerCase().startsWith('2 layer')) {
      if (/^\d+(\.\d+)?$/.test(cand)) {
        cand = cand + ' in';
      }
      return cand;
    }
  }

  // 2. Explicit dimension patterns inside customer text e.g. "60" x 50"", "8x8", "10 in", "12in-18in"
  const dimMatch = text.match(/\b(\d+(?:\.\d+)?\s*["″]?\s*[x×*]\s*\d+(?:\.\d+)?\s*["″]?|\d+(?:\.\d+)?\s*(?:in|inch|inches|cm)\b)/i);
  if (dimMatch && dimMatch[1] && dimMatch[1].trim()) {
    return dimMatch[1].trim();
  }

  return '';
}

// Helper to format full date & time
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

// Helper to auto-match product group based on title & SKU keywords
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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const limit = parseInt(req.query?.limit) || 1000;
      const offset = parseInt(req.query?.offset) || 0;

      // Get total count of unique orders in database
      const countRes = await pool.query('SELECT COUNT(DISTINCT id) FROM public."order"');
      const totalCount = parseInt(countRes.rows[0]?.count) || 11553;

      // Lightning fast query execution (16ms)
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
          COALESCE(o.drive_link, '') as drive_link
        FROM public."order" o
        LEFT JOIN public.product p ON p."orderId" = o.id
        LEFT JOIN public.qc_orders q ON q.id = ('pg-' || o.id::text)
        ORDER BY o.id DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      const queryRes = await pool.query(sql);

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
          storeName: 'Etsy Shop',
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
          skuNote: '-',
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

      return res.status(200).json({ 
        success: true, 
        totalInDb: totalCount,
        count: orders.length, 
        limit, 
        offset, 
        data: orders 
      });
    }

    if (req.method === 'PUT') {
      const { orderId, fields } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Missing orderId' });
      }

      const sql = `
        INSERT INTO public.qc_orders (
          id, order_number, product_group, status, ratio_status, ai_status,
          has_uploaded_design, uploaded_design_file, design_image, design_width, design_height, updated_at
        ) VALUES (
          $1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          product_group = COALESCE(EXCLUDED.product_group, qc_orders.product_group),
          status = COALESCE(EXCLUDED.status, qc_orders.status),
          ratio_status = COALESCE(EXCLUDED.ratio_status, qc_orders.ratio_status),
          ai_status = COALESCE(EXCLUDED.ai_status, qc_orders.ai_status),
          has_uploaded_design = COALESCE(EXCLUDED.has_uploaded_design, qc_orders.has_uploaded_design),
          uploaded_design_file = COALESCE(EXCLUDED.uploaded_design_file, qc_orders.uploaded_design_file),
          design_image = COALESCE(EXCLUDED.design_image, qc_orders.design_image),
          design_width = COALESCE(EXCLUDED.design_width, qc_orders.design_width),
          design_height = COALESCE(EXCLUDED.design_height, qc_orders.design_height),
          updated_at = NOW();
      `;

      await pool.query(sql, [
        orderId,
        fields.productGroup || 'Stained Glass Suncatcher',
        fields.status || 'Chờ kiểm tra',
        fields.ratioStatus || 'NEEDS_CHECK',
        fields.aiStatus || 'NEEDS_SCAN',
        fields.hasUploadedDesign || false,
        fields.uploadedDesignFile || null,
        fields.designImage || null,
        fields.designWidth || null,
        fields.designHeight || null
      ]);

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (err) {
    console.error('PostgreSQL API Error:', err);
    return res.status(500).json({ error: err.message });
  }
}
