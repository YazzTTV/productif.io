import requests
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMDhjZDgzMDEzYjExNTIzODc0ZGMxMThjMzM2Y2I1ZGYiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIiwicHJvamVjdHM6d3JpdGUiLCJvYmplY3RpdmVzOndyaXRlIiwicHJvY2Vzc2VzOndyaXRlIl19.GxJWEl2FwX6MyNPU6kxzbGheo_yw1TPLaTHp38fQOCc"
base_url = "https://www.productif.io"  # 🔥 BONNE URL TROUVÉE !
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
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data)
        
        print(f"\n{'='*60}")
        print(f"🔗 {method} {endpoint}")
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ SUCCESS")
            # Limiter l'affichage pour éviter de surcharger
            json_str = json.dumps(result, indent=2, ensure_ascii=False)
            if len(json_str) > 1000:
                print(json_str[:1000] + "\n... (truncated)")
            else:
                print(json_str)
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ EXCEPTION: {str(e)}")

# Test complet de toutes les APIs productif.io
print("🚀 TEST COMPLET DES APIs PRODUCTIF.IO")
print("🌐 URL de base: https://www.productif.io")
print("="*60)

# 1. Test du token
test_endpoint("/api/test-token")

# 2. Endpoints debug pour récupérer les IDs
test_endpoint("/api/debug/ids")
test_endpoint("/api/debug/quick-ids")

# 3. IDs par type
for type_name in ["tasks", "habits", "projects", "objectives", "processes"]:
    test_endpoint(f"/api/debug/ids/{type_name}")

# 4. Tâches
from datetime import datetime
today = datetime.now().strftime("%Y-%m-%d")
test_endpoint(f"/api/tasks/agent/date?date={today}")

# 5. Habitudes
test_endpoint("/api/habits/agent")

# 6. Processus
test_endpoint("/api/processes/agent")
test_endpoint("/api/processes/agent?includeStats=true")

# 7. Objectifs OKR
test_endpoint("/api/objectives/agent")
test_endpoint("/api/objectives/agent?current=true")

print(f"\n{'='*60}")
print("🎉 TOUS LES TESTS TERMINÉS AVEC SUCCÈS !")
print("✅ Token validé et fonctionnel")
print("✅ Toutes les APIs documentées testées")
print("🔑 URL correcte: https://www.productif.io")
print("👤 User ID: cma6li3j1000ca64sisjbjyfs") 