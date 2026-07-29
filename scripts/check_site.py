import urllib.request
import re

url = 'https://etsy-design-qc-studio-tawny.vercel.app'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})

try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode('utf-8')
        print('HTML Status:', resp.status)
        print('HTML Title check:', '<title>' in html)
        
        matches = re.findall(r'src="(/assets/[^"]+)"', html)
        print('Assets JS:', matches)
        for m in matches:
            asset_url = url + m
            print('Fetching asset:', asset_url)
            with urllib.request.urlopen(asset_url) as a_resp:
                content = a_resp.read()
                print('Asset size:', len(content), 'bytes')
except Exception as e:
    print('Error:', e)
