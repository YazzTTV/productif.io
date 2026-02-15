import { SignJWT, importPKCS8 } from "jose";

const sa = JSON.parse(
  Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64, "base64").toString(
    "utf8",
  ),
);

async function makeBearer() {
  const now = Math.floor(Date.now() / 1000);
  const key = await importPKCS8(sa.private_key, "RS256");
  return await new SignJWT({})
    .setProtectedHeader({ alg: "RS256", kid: sa.private_key_id, typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(
      "https://risc.googleapis.com/google.identity.risc.v1beta.RiscManagementService",
    )
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
}

async function main() {
  const token = await makeBearer();
  const state = `verify-${Date.now()}`;

  const res = await fetch("https://risc.googleapis.com/v1beta/stream:verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ state }),
  });

  console.log("status:", res.status);
  console.log(await res.text());
  console.log("expected state:", state);
}

main();

