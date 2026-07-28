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

// Helper to parse size strictly from description / personalization text
function parseSize(descriptionText, personalizationText) {
  const fullText = (descriptionText || '') + ' ' + (personalizationText || '');
  const match = fullText.match(/(\d+(?:\.\d+)?\s*(?:in|inch|inches|cm|X\d+cm|x\d+cm))/i);
  if (match) {
    return match[1].trim();
  }
  return '';
}

// Helper to format full date & time (e.g. "May 29, 2026" + time -> "2026-05-29 01:31")
function formatFullDateTime(dateStr, createdAt) {
  try {
    let year = 2026, month = '05', day = '29', hours = '00', mins = '00';

    if (createdAt) {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        year = d.getFullYear();
        month = String(d.getMonth() + 1).padStart(2, '0');
        day = String(d.getDate()).padStart(2, '0');
        hours = String(d.getHours()).padStart(2, '0');
        mins = String(d.getMinutes()).padStart(2, '0');
      }
    }

    if (dateStr) {
      const dDate = new Date(dateStr);
      if (!isNaN(dDate.getTime())) {
        year = dDate.getFullYear();
        month = String(dDate.getMonth() + 1).padStart(2, '0');
        day = String(dDate.getDate()).padStart(2, '0');
      }
    }

    return `${year}-${month}-${day} ${hours}:${mins}`;
  } catch (e) {}
  return dateStr || createdAt || '';
}

// Helper to auto-match product group based on title & SKU keywords
function autoMatchGroup(title = '', sku = '') {
  const text = (title + ' ' + sku).toLowerCase();
  if (text.includes('desk mat')) return 'Desk Mat';
  if (text.includes('graduation cap') || text.includes('cap topper')) return 'Graduation Cap';
  if (text.includes('stole')) return 'Stole';
  if (text.includes('2 layer') && (text.includes('square') || text.includes('4'))) return '2 layer Wooden 4';
  if (text.includes('2 layer')) return '2 layer Wooden 2';
  if (text.includes('1 layer') || text.includes('wooden sign') || text.includes('wood sign')) return '1 layer wooden';
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
      // Query ALL real live orders from PostgreSQL order_info & product tables without omitting any details
      const queryRes = await pool.query(`
        SELECT DISTINCT ON (o.id)
          o.id,
          o."orderId" as order_number,
          o."orderDate" as order_date,
          o."createdAt" as created_at,
          o."shopName" as store_name,
          o."buyerName" as customer_name,
          o."buyerEmail" as customer_email,
          o."giftMessage" as gift_message,
          COALESCE(p.name, o.title) as product_title,
          COALESCE(p.quantity, o.quantity::integer, 1) as quantity,
          COALESCE(p.sku, o.skus) as sku,
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
          q.status,
          d.drive_link,
          s.text as sku_note
        FROM public.order_info o
        LEFT JOIN public.product p ON p."orderId" = o.id
        LEFT JOIN public.qc_orders q ON q.id = ('pg-' || o.id::text)
        LEFT JOIN (
          SELECT sku, MAX(drive_link) as drive_link FROM public.design_file GROUP BY sku
        ) d ON d.sku = COALESCE(p.sku, o.skus)
        LEFT JOIN (
          SELECT sku, MAX(text) as text FROM public.sku_note GROUP BY sku
        ) s ON s.sku = COALESCE(p.sku, o.skus)
        ORDER BY o.id DESC
      `);

      const orders = queryRes.rows.map(row => {
        const parsedSize = parseSize(row.description_raw, row.personalization_raw);
        const fullDateTime = formatFullDateTime(row.order_date, row.created_at);

        // Build comprehensive personalization text combining all non-empty customer request fields
        const personalizationParts = [];
        if (row.personalization_raw && row.personalization_raw.trim()) {
          personalizationParts.push(row.personalization_raw.trim());
        }
        if (row.description_raw && row.description_raw.trim()) {
          personalizationParts.push(`Options: ${row.description_raw.trim()}`);
        }
        if (row.gift_message && row.gift_message.trim()) {
          personalizationParts.push(`Gift Message: ${row.gift_message.trim()}`);
        }
        if (row.product_mockup_note && row.product_mockup_note.trim()) {
          personalizationParts.push(`Note: ${row.product_mockup_note.trim()}`);
        }

        const combinedPersonalizationText = personalizationParts.join('\n---\n');
        const matchedGroup = row.product_group || autoMatchGroup(row.product_title, row.sku);

        return {
          id: `pg-${row.id}`,
          orderDate: fullDateTime,
          storeName: row.store_name || 'Etsy Shop',
          customerName: row.customer_name || '',
          customerEmail: row.customer_email || '',
          storeIcon: 'Etsy',
          orderNumber: row.order_number || `#${row.id}`,
          productTitle: row.product_title || '',
          productGroup: matchedGroup,
          quantity: Number(row.quantity) || 1,
          sku: row.sku || '',
          personalization: {
            size: parsedSize,
            text: combinedPersonalizationText || 'Yêu cầu khách không ghi'
          },
          note: row.product_mockup_note || row.gift_message || '-',
          skuNote: row.sku_note || '-',
          driveLink: row.drive_link || '',
          hasUploadedDesign: row.has_uploaded_design || false,
          uploadedDesignFile: row.uploaded_design_file || null,
          designImage: row.design_image || null,
          designWidth: row.design_width || null,
          designHeight: row.design_height || null,
          designAspectRatio: row.design_width && row.design_height ? row.design_width / row.design_height : null,
          targetSizeLabel: parsedSize,
          targetWidth: null,
          targetHeight: null,
          ratioStatus: row.ratio_status || 'NEEDS_CHECK',
          aiStatus: row.ai_status || 'NEEDS_SCAN',
          aiScore: row.ai_score || null,
          status: row.status || 'Chờ kiểm tra',
          mockupThumb: row.mockup_thumb || '/_4123920413.png',
          assignee: 'Dakuho (QC SP)'
        };
      });

      return res.status(200).json({ success: true, count: orders.length, data: orders });
    }

    if (req.method === 'PUT') {
      const { orderId, fields } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Missing orderId' });
      }

      // Upsert order QC status and design image into qc_orders table
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
