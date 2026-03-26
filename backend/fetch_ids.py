import requests
import datetime

CEDA_API_KEY = "cf925897851952e0f90bced89d94bd443791eca69e2bfc59605bda02d88c3414"

headers = {
    "Authorization": f"Bearer {CEDA_API_KEY}"
}

today = datetime.date.today()
last_month = today - datetime.timedelta(days=30)
url = "https://api.ceda.ashoka.edu.in/v1/agmarknet/prices"

def test_payload(commodity_id, state_id, district_id=None):
    params = {
        "commodity_id": commodity_id,
        "state_id": state_id,
        "start_date": last_month.strftime("%Y-%m-%d"),
        "end_date": today.strftime("%Y-%m-%d")
    }
    if district_id:
        params["district_id"] = district_id
        
    r = requests.post(url, headers=headers, params=params)
    print(f"Testing Query Params commodity={commodity_id}, state={state_id}: {r.status_code}")
    if r.status_code == 200:
        res = r.json().get('results', [])
        print(f"✅ Success! Returned {len(res)} results.")
        if len(res) > 0:
            print(f"Sample: {res[0]}")
            return True
    else:
        print(f"Error: {r.text[:200]}")
    return False

# Test the user's placeholders:
print("Testing user placeholders...")
test_payload(17, 27, 123)
