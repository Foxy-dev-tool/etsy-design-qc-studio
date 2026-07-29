// Strict Size Scanner V2
function extractStrictSize(order) {
  if (!order || !order.personalization) return '';

  const text = (order.personalization.text || '').trim();
  if (!text) return '';

  // 1. Explicit Size line e.g. "Size (inches): 8", "Size: 60\" x 50\"", "Size: 8x8", "Kích thước: 10 in"
  const lineMatch = text.match(/(?:Khách đặt Size|Select Size|Size\s*(?:\([^)]*\))?|size|Kích thước|Dimensions)\s*[:=]\s*([^\n\r,]+)/i);
  if (lineMatch && lineMatch[1] && lineMatch[1].trim()) {
    let cand = lineMatch[1].trim();
    if (!cand.toLowerCase().startsWith('1 layer') && !cand.toLowerCase().startsWith('2 layer')) {
      // If candidate is just a number like "8", format as "8 in"
      if (/^\d+(\.\d+)?$/.test(cand)) {
        cand = cand + ' in';
      }
      return cand;
    }
  }

  // 2. Explicit dimension patterns inside customer text e.g. "60\" x 50\"", "8x8", "10 in", "12in-18in"
  const dimMatch = text.match(/\b(\d+(?:\.\d+)?\s*["″]?\s*[x×*]\s*\d+(?:\.\d+)?\s*["″]?|\d+(?:\.\d+)?\s*(?:in|inch|inches|cm)\b)/i);
  if (dimMatch && dimMatch[1] && dimMatch[1].trim()) {
    return dimMatch[1].trim();
  }

  return '';
}

// Cleaning customer text box so size lines are stripped
function cleanPersonalizationText(rawText) {
  if (!rawText || !rawText.trim()) return '';
  
  const lines = rawText.split('\n');
  const filtered = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    
    // Remove lines that state size e.g. "Size (inches): 8", "Size: 6 in"
    if (trimmed.match(/^(?:Khách đặt Size|Select Size|Size\s*(?:\([^)]*\))?|size|Kích thước|Dimensions)\s*[:=]/i)) {
      return false;
    }
    return true;
  });

  return filtered.join('\n').trim();
}

console.log('--- TEST PHOTO 1 ---');
const p1Text = "Size (inches): 8\nPersonalization: Melissa's Bookshop\nEst. 2026";
console.log('Extracted Size:', extractStrictSize({ personalization: { text: p1Text } }));
console.log('Cleaned Text:\n' + cleanPersonalizationText(p1Text));

console.log('\n--- TEST PHOTO 2 ---');
const p2Text = "Style: 2 Layers (3D)\nCustom Number: 209\nCustom Name: Chloe and Kaitlyn\nOuter Border Color Options: 7\nInner Color Options: 4\n---\nCustomer Note: Move in day is 08/19 if you could put a rush on the order that would be amazing";
console.log('Extracted Size:', extractStrictSize({ personalization: { text: p2Text } }));
console.log('Cleaned Text:\n' + cleanPersonalizationText(p2Text));

console.log('\n--- TEST PHOTO 3 ---');
const p3Text = "Custom Names: Chae & Michael\nCustom Year: 07.25.2026";
console.log('Extracted Size:', extractStrictSize({ personalization: { text: p3Text } }));
console.log('Cleaned Text:\n' + cleanPersonalizationText(p3Text));
