import { SignJWT, importPKCS8 } from "jose";

const saB64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64;
if (!saB64) throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON_B64");

const receiverEndpoint = process.env.RISC_RECEIVER_ENDPOINT;
if (!receiverEndpoint) throw new Error("Missing RISC_RECEIVER_ENDPOINT");

const sa = JSON.parse(Buffer.from(saB64, "base64").toString("utf8"));

const eventsRequested = [
  "https://schemas.openid.net/secevent/risc/event-type/sessions-revoked",
  "https://schemas.openid.net/secevent/oauth/event-type/tokens-revoked",
  "https://schemas.openid.net/secevent/risc/event-type/account-disabled",
  "https://schemas.openid.net/secevent/risc/event-type/verification",
];

async function makeBearer() {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(sa.private_key, "RS256");

  return await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: sa.private_key_id, typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://risc.googleapis.com/google.identity.risc.v1beta.RiscManagementService")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
}

async function main() {
  const token = await makeBearer();

  const res = await fetch("https://risc.googleapis.com/v1beta/stream:update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      delivery: {
        delivery_method: "https://schemas.openid.net/secevent/risc/delivery-method/push",
        url: receiverEndpoint,
      },
      events_requested: eventsRequested,
    }),
  });

  const text = await res.text();
  console.log("status:", res.status);
  console.log(text);
  if (!res.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

