import pandas as pd
import json
import os

def clean_note_text(raw_note):
    if not raw_note or pd.isna(raw_note) or str(raw_note).strip() in ['nan', 'None', '-']:
        return '-'
    
    raw_str = str(raw_note).strip()
    
    if raw_str.startswith('[') and raw_str.endswith(']'):
        try:
            parsed = json.loads(raw_str)
            if isinstance(parsed, list):
                texts = []
                for item in parsed:
                    if isinstance(item, dict) and 'text' in item:
                        t = str(item['text']).strip()
                        if t:
                            texts.append(t)
                    elif isinstance(item, str):
                        texts.append(item.strip())
                if texts:
                    return ' • '.join(texts)
        except Exception:
            pass
            
    raw_str = raw_str.replace('\\n', ' ').replace('\n', ' ').strip()
    return raw_str if raw_str else '-'

# Strict size parsing from customer personalization text only
def parse_size_strictly_from_customer_text(pers_text):
    if not pers_text or pd.isna(pers_text):
        return "", None, None
        
    raw_str = str(pers_text).strip()
    if not raw_str or raw_str == 'nan':
        return "", None, None

    text_lower = raw_str.lower()
    lines = [l.strip() for l in raw_str.split('\n') if l.strip()]

    if '9.84' in text_lower or '9,84' in text_lower:
        return '9.84 inches', 3012, 3012
    elif '7.87' in text_lower or '7,87' in text_lower:
        return '7.87 inches', 2421, 2421
    elif '5.9' in text_lower or '5,9' in text_lower:
        return '5.9 inches', 1831, 1831
    elif '3.94' in text_lower or '3,94' in text_lower:
        return '3.94 inches', 1240, 1240
    elif '3.54' in text_lower or '3,54' in text_lower:
        return '3.54 inches', 1181, 2362
    elif '12' in text_lower and ('inch' in text_lower or '12in' in text_lower or '12"' in text_lower):
        return '12 inches', 3718, 7436
    elif '7.5' in text_lower or '7,5' in text_lower:
        return '7.5 inches', 3200, 3200
    elif '9.5' in text_lower or '9,5' in text_lower:
        return '9.5 inches', 4048, 4048

    elif '90x40' in text_lower or '90*40' in text_lower or '90 x 40' in text_lower:
        return '90X40cm', 5374, 2421
    elif '80x30' in text_lower or '80*30' in text_lower or '80 x 30' in text_lower:
        return '80X30cm', 4843, 1890
    elif '70x35' in text_lower or '70*35' in text_lower or '70 x 35' in text_lower:
        return '70X35cm', 4193, 2126
    elif '60x30' in text_lower or '60*30' in text_lower or '60 x 30' in text_lower:
        return '60X30cm', 3602, 1831
    elif '45x40' in text_lower or '45*40' in text_lower or '45 x 40' in text_lower:
        return '45x40cm', 2717, 2421
    elif '30x25' in text_lower or '30*25' in text_lower or '30 x 25' in text_lower:
        return '30X25cm', 1831, 1535
    elif '18x22' in text_lower or '18*22' in text_lower or '18 x 22' in text_lower:
        return '18X22cm', 1081, 1317

    for line in lines:
        l_lower = line.lower()
        if l_lower.startswith('size:') or l_lower.startswith('size + style:') or l_lower.startswith('size&style:'):
            parts = line.split(':', 1)
            if len(parts) > 1:
                val = parts[1].strip()
                if val:
                    return val, None, None

    if 'size: adult' in text_lower or 'stole: adult' in text_lower or 'adult size' in text_lower:
        return 'Adult', 2430, 3668
    elif 'size: kid' in text_lower or 'stole: kid' in text_lower or 'kid size' in text_lower:
        return 'Kid', 2430, 3300

    return "", None, None

def format_shop_name(shop_id):
    if pd.notnull(shop_id) and str(shop_id).strip() not in ['nan', 'None', '']:
        s_id = str(shop_id).strip()
        if s_id.isdigit():
            return f"Shop #{s_id}"
        return str(s_id)
    return "Shop Etsy"

def process_csv_files():
    print("Reading order.csv and product.csv...")
    df_ord = pd.read_csv('order.csv')
    df_prod = pd.read_csv('product.csv')

    print(f"Loaded {len(df_ord)} orders and {len(df_prod)} products.")

    merged = pd.merge(df_prod, df_ord, left_on='orderId', right_on='id', suffixes=('_prod', '_ord'))
    
    merged['created_dt'] = pd.to_datetime(merged['createdAt_ord'], errors='coerce')
    merged = merged.sort_values(by='created_dt', ascending=False)
    
    print(f"Total merged records: {len(merged)} (Sorted newest to oldest).")

    orders = []
    
    for idx, row in merged.iterrows():
        code = str(row.get('orderCode', ''))
        if code and code != 'nan' and not code.startswith('#'):
            code = '#' + code
        elif not code or code == 'nan':
            code = f"#ORD-{idx+1000}"
            
        raw_pers = str(row.get('personalization', ''))
        if raw_pers == 'nan':
            raw_pers = ''
            
        prod_name = str(row.get('name', ''))
        if prod_name == 'nan':
            prod_name = 'Custom Etsy Product'
            
        sku_str = str(row.get('sku', 'SKU-CUSTOM'))
        if sku_str == 'nan':
            sku_str = 'SKU-CUSTOM'
            
        size_label, w_px, h_px = parse_size_strictly_from_customer_text(raw_pers)
        
        img_url = str(row.get('imgSrc', ''))
        if img_url == 'nan' or not img_url:
            img_url = '/_4123920413.png'
            
        created_at = str(row.get('createdAt_ord', ''))
        if created_at.endswith('+00'):
            created_at = created_at[:16].replace('T', ' ')
        elif created_at == 'nan':
            created_at = '2026-07-24 10:00'
            
        note_val = clean_note_text(row.get('note'))
        sku_note_val = clean_note_text(row.get('mockup_note'))
        cust_note_val = clean_note_text(row.get('customerNote'))

        final_note = note_val
        if cust_note_val != '-' and cust_note_val != note_val:
            if final_note != '-':
                final_note = f"{cust_note_val} | {final_note}"
            else:
                final_note = cust_note_val

        drive_val = str(row.get('drive_link', 'drive.google.com/file/...'))
        if drive_val == 'nan' or not drive_val:
            drive_val = 'drive.google.com/file/...'

        # Store / Shop Name extracted directly from shopId!
        shop_name_formatted = format_shop_name(row.get('shopId'))
        customer_name_str = str(row.get('customerName', 'Customer')) if pd.notnull(row.get('customerName')) and str(row.get('customerName')) != 'nan' else 'Customer'

        order_obj = {
            'id': f"real-ord-{row.get('id_prod', idx)}",
            'orderDate': created_at,
            'storeName': shop_name_formatted, # SHOP NAME! (e.g. Shop #6, Shop #3)
            'customerName': customer_name_str,
            'storeIcon': 'Etsy',
            'orderNumber': code,
            'productTitle': prod_name,
            'productGroup': 'Stained Glass Suncatcher',
            'quantity': int(row.get('quantity', 1)) if pd.notnull(row.get('quantity')) else 1,
            'sku': sku_str,
            'personalization': {
                'size': size_label,
                'text': raw_pers
            },
            'note': final_note,
            'skuNote': sku_note_val,
            'driveLink': drive_val,
            
            'hasUploadedDesign': False,
            'uploadedDesignFile': None,
            'designImage': None,
            'designWidth': None,
            'designHeight': None,
            'designAspectRatio': None,
            'targetSizeLabel': size_label,
            'targetWidth': w_px,
            'targetHeight': h_px,
            'ratioStatus': 'NEEDS_CHECK',
            'aiStatus': 'NEEDS_SCAN',
            'aiScore': None,
            'aiReport': None,
            'status': 'Chờ kiểm tra',
            
            'mockupThumb': img_url,
            'assignee': 'Dakuho (QC SP)',
            'approvalShip': {
                'approvedBy': 'Dakuho' if row.get('is_approved') in [True, 1, '1', 'true'] else '',
                'approvalTime': str(row.get('approved_at', ''))[:16] if pd.notnull(row.get('approved_at')) and str(row.get('approved_at')) != 'nan' else '',
                'shipped': True if row.get('is_shipped') in [True, 1, '1', 'true'] else False
            }
        }
        orders.append(order_obj)

    os.makedirs('src/data', exist_ok=True)
    out_path = 'src/data/realOrders.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(orders, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {len(orders)} real CSV orders in {out_path} with SHOP NAME for storeName!")

if __name__ == '__main__':
    process_csv_files()
