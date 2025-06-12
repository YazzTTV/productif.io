import requests
import json
import base64

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbklkIjoiMDhjZDgzMDEzYjExNTIzODc0ZGMxMThjMzM2Y2I1ZGYiLCJ1c2VySWQiOiJjbWE2bGkzajEwMDBjYTY0c2lzamJqeWZzIiwic2NvcGVzIjpbImhhYml0czpyZWFkIiwidGFza3M6cmVhZCIsInByb2plY3RzOnJlYWQiLCJvYmplY3RpdmVzOnJlYWQiLCJwcm9jZXNzZXM6cmVhZCIsInRhc2tzOndyaXRlIiwiaGFiaXRzOndyaXRlIiwicHJvamVjdHM6d3JpdGUiLCJvYmplY3RpdmVzOndyaXRlIiwicHJvY2Vzc2VzOndyaXRlIl19.GxJWEl2FwX6MyNPU6kxzbGheo_yw1TPLaTHp38fQOCc"

print("🔍 DÉBOGAGE DU TOKEN")
print("="*50)

# Analyser le token JWT
try:
    header, payload, signature = token.split('.')
    
    # Décoder le header
    header_decoded = json.loads(base64.urlsafe_b64decode(header + '==='))
    print("📋 HEADER JWT:")
    print(json.dumps(header_decoded, indent=2))
    
    # Décoder le payload
    payload_decoded = json.loads(base64.urlsafe_b64decode(payload + '==='))
    print("\n📋 PAYLOAD JWT:")
    print(json.dumps(payload_decoded, indent=2))
    
    print(f"\n🔑 Token ID: {payload_decoded.get('tokenId')}")
    print(f"👤 User ID: {payload_decoded.get('userId')}")
    print(f"🔐 Scopes: {payload_decoded.get('scopes')}")
    
except Exception as e:
    print(f"❌ Erreur décodage token: {e}")

print("\n" + "="*50)
print("🧪 TESTS D'AUTHENTIFICATION")

# Test 1: Avec Bearer
print("\n1️⃣ Test avec Bearer standard")
headers1 = {"Authorization": f"Bearer {token}"}
try:
    response = requests.get("https://productif.io/api/test-token", headers=headers1)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Erreur: {e}")

# Test 2: Sans Content-Type
print("\n2️⃣ Test sans Content-Type")
headers2 = {"Authorization": f"Bearer {token}"}
try:
    response = requests.get("https://productif.io/api/test-token", headers=headers2)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Erreur: {e}")

# Test 3: Headers complets
print("\n3️⃣ Test avec headers complets")
headers3 = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "ProductifIO-API-Test/1.0"
}
try:
    response = requests.get("https://productif.io/api/test-token", headers=headers3)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Erreur: {e}")

# Test 4: Endpoint différent
print("\n4️⃣ Test endpoint différent")
try:
    response = requests.get("https://productif.io/api/habits/agent", headers=headers1)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Erreur: {e}")

print("\n" + "="*50)
print("�� Débogage terminé") 