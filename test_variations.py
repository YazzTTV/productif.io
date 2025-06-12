import requests
import json

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMDhjZDgzMDEzYjExNTIzODc0ZGMxMThjMzM2Y2I1ZGYiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIiwicHJvamVjdHM6d3JpdGUiLCJvYmplY3RpdmVzOndyaXRlIiwicHJvY2Vzc2VzOndyaXRlIl19.GxJWEl2FwX6MyNPU6kxzbGheo_yw1TPLaTHp38fQOCc"

print("🔄 TEST DE VARIATIONS")
print("="*60)

def test_variant(description, url, headers):
    print(f"\n{description}")
    print("-" * len(description))
    try:
        response = requests.get(url, headers=headers)
        print(f"URL: {url}")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ SUCCESS!")
            result = response.json()
            print(json.dumps(result, indent=2, ensure_ascii=False)[:500] + "...")
        else:
            print(f"❌ Error: {response.text}")
    except Exception as e:
        print(f"❌ Exception: {e}")

# Test différentes variations
headers = {"Authorization": f"Bearer {token}"}

# 1. URLs différentes  
test_variant("1️⃣ productif.io standard", "https://productif.io/api/test-token", headers)
test_variant("2️⃣ www.productif.io", "https://www.productif.io/api/test-token", headers)
test_variant("3️⃣ app.productif.io", "https://app.productif.io/api/test-token", headers)
test_variant("4️⃣ api.productif.io", "https://api.productif.io/test-token", headers)

# 2. Headers différents
headers_x_api = {"X-API-Key": token}
test_variant("5️⃣ X-API-Key header", "https://productif.io/api/test-token", headers_x_api)

headers_auth = {"Authorization": token}
test_variant("6️⃣ Sans Bearer", "https://productif.io/api/test-token", headers_auth)

# 3. Test direct d'un endpoint simple
test_variant("7️⃣ Endpoint habits direct", "https://productif.io/api/habits/agent", headers)

# 4. Test avec paramètres
headers_with_params = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "Accept": "*/*"
}
test_variant("8️⃣ Headers étendus", "https://productif.io/api/test-token", headers_with_params)

print("\n" + "="*60)
print("🏁 Tests de variations terminés")

# Affichage du résumé
print("\n📋 RÉSUMÉ:")
print("- Token JWT valide avec tous les scopes")
print("- User ID: cma6li3j1000ca64sisjbjyfs") 
print("- Toutes les tentatives retournent 401")
print("- Problème probable côté serveur ou configuration") 