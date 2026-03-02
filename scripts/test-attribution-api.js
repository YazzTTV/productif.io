#!/usr/bin/env node

/**
 * Teste l'API POST /api/user/attribution.
 * Se connecte avec email/password pour obtenir un JWT, puis envoie une attribution de test.
 *
 * Usage:
 *   node scripts/test-attribution-api.js [email] [password]
 *   TEST_ATTRIBUTION_EMAIL=xxx TEST_ATTRIBUTION_PASSWORD=xxx node scripts/test-attribution-api.js
 *
 * Exemple:
 *   node scripts/test-attribution-api.js noah.l@free.fr monmotdepasse
 */

import { config } from 'dotenv';

config();

const API_BASE = process.env.TEST_ATTRIBUTION_API_URL || process.env.API_URL || 'https://www.productif.io/api';

async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed ${res.status}: ${text}`);
  }
  const data = await res.json();
  if (!data.token) throw new Error('No token in login response');
  return data.token;
}

async function postAttribution(token, payload) {
  const res = await fetch(`${API_BASE}/user/attribution`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return { status: res.status, ok: res.ok, body: res.status !== 204 ? await res.json().catch(() => ({})) : null };
}

async function main() {
  const email = process.argv[2] || process.env.TEST_ATTRIBUTION_EMAIL;
  const password = process.argv[3] || process.env.TEST_ATTRIBUTION_PASSWORD;

  if (!email || !password) {
    console.error('Usage: node scripts/test-attribution-api.js <email> <password>');
    console.error('   or: TEST_ATTRIBUTION_EMAIL=... TEST_ATTRIBUTION_PASSWORD=... node scripts/test-attribution-api.js');
    process.exit(1);
  }

  console.log('🔐 Login:', email);
  let token;
  try {
    token = await login(email, password);
    console.log('   Token reçu\n');
  } catch (e) {
    console.error('❌', e.message);
    process.exit(1);
  }

  const payload = {
    referredBy: 'test_affiliate_123',
    attributionSource: 'test_script',
    attributionProvider: 'appsflyer',
    attributionData: {
      media_source: 'test_script',
      campaign: 'test_campaign',
      af_sub1: 'test_affiliate_123',
      af_channel: 'api_test',
    },
  };

  console.log('📤 POST /user/attribution');
  console.log('   Payload:', JSON.stringify(payload, null, 2));
  console.log('');

  const result = await postAttribution(token, payload);

  console.log('📥 Réponse:', result.status, result.status === 204 ? '(No Content)' : '');
  if (result.body) console.log('   Body:', JSON.stringify(result.body, null, 2));
  console.log('');

  if (result.status === 204) {
    console.log('✅ 204 = user déjà attribué (first-touch), rien à faire.');
  } else if (result.ok && result.body?.success) {
    console.log('✅ Attribution enregistrée.');
  } else if (!result.ok) {
    console.error('❌ Erreur API:', result.body?.error || result.status);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
