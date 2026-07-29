// Strict Size Scanner Test Script
function extractStrictSize(order) {
  if (!order || !order.personalization) return '';

  const sizeObj = order.personalization.size;
  if (sizeObj && String(sizeObj).trim()) {
    return String(sizeObj).trim();
  }

  const text = (order.personalization.text || '').trim();
  if (!text) return '';

  // 1. Explicit Size line e.g. Size: 6 in, Size: 60" x 50", Size: 8x8, Size: 10 in
  const lineMatch = text.match(/(?:Khách đặt Size|Select Size|Size|size|Kích thước|Dimensions)\s*[:=]\s*([^\n\r,]+)/i);
  if (lineMatch && lineMatch[1] && lineMatch[1].trim()) {
    const cand = lineMatch[1].trim();
    if (!cand.toLowerCase().startsWith('1 layer') && !cand.toLowerCase().startsWith('2 layer')) {
      return cand;
    }
  }

  // 2. Strict Dimensions pattern in customer text only:
  // e.g. 60" x 50", 8x8, 8x8 inch, 10 in, 10.5in, 90x40cm, 3.94 in
  const dimMatch = text.match(/\b(\d+(?:\.\d+)?\s*["″]?\s*[x×*]\s*\d+(?:\.\d+)?\s*["″]?|\d+(?:\.\d+)?\s*(?:in|inch|inches|cm)\b)/i);
  if (dimMatch && dimMatch[1] && dimMatch[1].trim()) {
    return dimMatch[1].trim();
  }

  // 3. Apparel Size
  const clothingMatch = text.match(/\b(XS|S|M|L|XL|2XL|3XL|4XL|5XL|Small|Medium|Large|X-Large|2X-Large|3X-Large)\b/i);
  if (clothingMatch && clothingMatch[1] && clothingMatch[1].trim()) {
    return clothingMatch[1].trim();
  }

  return '';
}

console.log('Test 1 (60" x 50"):', extractStrictSize({ personalization: { text: 'Custom Names: Chae & Michael\nSize: 60" x 50"' } }));
console.log('Test 2 (8x8):', extractStrictSize({ personalization: { text: 'Style: 2 Layers (3D)\nSize: 8x8\nCustom Number: 209' } }));
console.log('Test 3 (10 in):', extractStrictSize({ personalization: { text: 'Grandma Garden\nSize: 10 in' } }));
console.log('Test 4 (NO SIZE):', extractStrictSize({ personalization: { text: 'Style: 2 Layers (3D)\nCustom Number: 209\nCustom Name: Chloe and Kaitlyn\nOuter Border Color Options: 7\nInner Color Options: 4\n---\nCustomer Note: Move in day is 08/19 if you could put a rush on the order that would be amazing' } }));
