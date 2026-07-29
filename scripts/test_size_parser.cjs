const { Client } = require('pg');

const client = new Client({
  host: '103.75.184.164',
  port: 5432,
  user: 'postgres',
  password: '123456a@',
  database: 'order_sync_db_dev'
});

function parseSize(descriptionText, personalizationText) {
  const fullText = (personalizationText || '') + '\n' + (descriptionText || '');
  if (!fullText.trim()) return '';

  // 1. Line starting with Size: / size: / Kích thước: / Dimensions:
  const lineMatch = fullText.match(/(?:Size|size|Kích thước|Dimensions)\s*[:=]\s*([^\n\r,]+)/i);
  if (lineMatch && lineMatch[1] && lineMatch[1].trim()) {
    return lineMatch[1].trim();
  }

  // 2. Explicit dimension patterns e.g. 8x8, 8×8, 60" x 50", 10x10, 3.94 in, 12in-18in
  const dimMatch = fullText.match(/(\d+(?:\.\d+)?\s*(?:in|inch|inches|cm|X\d+|\d+\s*["″]?\s*[x×*]\s*\d+["″]?|\d+in-\d+in))/i);
  if (dimMatch && dimMatch[1] && dimMatch[1].trim()) {
    return dimMatch[1].trim();
  }

  // 3. Clothing size e.g. 2XL, XL, Small, Medium, Large
  const clothingMatch = fullText.match(/\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL|Small|Medium|Large|X-Large|2X-Large|3X-Large)\b/i);
  if (clothingMatch && clothingMatch[1] && clothingMatch[1].trim()) {
    return clothingMatch[1].trim();
  }

  return '';
}

async function testDatabaseSizes() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT p.personalization, p.description
      FROM public.product p
      WHERE p.personalization IS NOT NULL AND p.personalization != ''
      LIMIT 20
    `);

    console.log('--- TEST DATABASE SIZE PARSING ---');
    for (const row of res.rows) {
      const sz = parseSize(row.description, row.personalization);
      console.log(`PARSED: "${sz}" | TEXT: "${row.personalization.replace(/\n/g, ' ')}"`);
    }

    await client.end();
  } catch (err) {
    console.error(err);
  }
}

testDatabaseSizes();
