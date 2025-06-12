import requests
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMDhjZDgzMDEzYjExNTIzODc0ZGMxMThjMzM2Y2I1ZGYiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIiwicHJvamVjdHM6d3JpdGUiLCJvYmplY3RpdmVzOndyaXRlIiwicHJvY2Vzc2VzOndyaXRlIl19.GxJWEl2FwX6MyNPU6kxzbGheo_yw1TPLaTHp38fQOCc"
base_url = "https://productif.io"
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

def test_endpoint(endpoint, method="GET", data=None):
    try:
        url = f"{base_url}{endpoint}"
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data)
        
        print(f"\n{'='*50}")
        print(f"🔗 {method} {endpoint}")
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ EXCEPTION: {str(e)}")

# Test des endpoints principaux
print("🚀 Test des APIs productif.io")

# 1. Test du token
test_endpoint("/api/test-token")

# 2. Tous les IDs
test_endpoint("/api/debug/ids")

# 3. IDs rapides
test_endpoint("/api/debug/quick-ids")

# 4. Tâches du jour
from datetime import datetime
today = datetime.now().strftime("%Y-%m-%d")
test_endpoint(f"/api/tasks/agent/date?date={today}")

# 5. Habitudes
test_endpoint("/api/habits/agent")

# 6. Processus
test_endpoint("/api/processes/agent")

# 7. Objectifs
test_endpoint("/api/objectives/agent")

# 8. IDs par type
for type_name in ["tasks", "habits", "projects", "objectives", "processes"]:
    test_endpoint(f"/api/debug/ids/{type_name}")

print(f"\n{'='*50}")
print("🏁 Tests terminés !") 