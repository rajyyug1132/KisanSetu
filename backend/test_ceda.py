import requests
import datetime

CEDA_API_KEY = "cf925897851952e0f90bced89d94bd443791eca69e2bfc59605bda02d88c3414" 

def get_mandi_intelligence(commodity="Paddy", district="Nashik"):
    url = "https://api.ceda.ashoka.edu.in/v1/agmarknet/prices"
    
    today = datetime.date.today()
    last_month = today - datetime.timedelta(days=30)
    
    headers = {
        "Authorization": f"Bearer {CEDA_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "commodity": commodity,
        "district": district,
        "start_date": last_month.strftime("%Y-%m-%d"),
        "end_date": today.strftime("%Y-%m-%d")
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        return response.json().get('results', [])
    else:
        print(f"Error: {response.status_code} - {response.text}")
        return []

print(get_mandi_intelligence())

print(get_mandi_intelligence())
