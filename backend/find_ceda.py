import requests
import json

h = {'Authorization': 'Bearer cf925897851952e0f90bced89d94bd443791eca69e2bfc59605bda02d88c3414'}
base = 'https://api.ceda.ashoka.edu.in/v1/agmarknet'

print("--- COMMODITIES ---")
c_res = requests.get(f'{base}/commodities', headers=h)
if c_res.status_code == 200:
    targets = ['wheat', 'cotton', 'onion', 'tomato', 'soyabean', 'soybean', 'soya']
    found = []
    for c in c_res.json().get('output', {}).get('data', []):
        name = str(c.get('commodity_name', '')).lower()
        if any(t in name for t in targets):
            found.append(c)
    
    # Sort for easier reading
    for f in sorted(found, key=lambda x: x['commodity_name']):
        print(f)

print("\n--- GEOGRAPHIES ---")
g_res = requests.get(f'{base}/geographies', headers=h)
if g_res.status_code == 200:
    for loc in g_res.json().get('output', {}).get('data', []):
        state = str(loc.get('census_state_name', '')).lower()
        dist = str(loc.get('census_district_name', '')).lower()
        if 'maha' in state and ('nashik' in dist or 'nasik' in dist):
            print(loc)

