import pandas as pd
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

df_prod = pd.read_csv('product.csv')
df_ord = pd.read_csv('order.csv')

merged = pd.merge(df_prod, df_ord, left_on='orderId', right_on='id', suffixes=('_prod', '_ord'))

print(f"Total merged products: {len(merged)}")

print("\n=== SAMPLE RECORDS DETAILS ===")
for idx, r in merged.head(15).iterrows():
    print(f"Order #{r.get('orderCode')} - Product: {r.get('name')[:60]}")
    print(f"  SKU: {r.get('sku')}")
    print(f"  Personalization: {repr(r.get('personalization'))}")
    print(f"  Mockup Note: {repr(r.get('mockup_note'))}")
    print(f"  Customer Note: {repr(r.get('customerNote'))}")
    print(f"  Note: {repr(r.get('note'))}")
    print("-" * 60)
