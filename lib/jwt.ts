import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
)

export async function sign(payload: any): Promise<string> {
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
  return jwt
}

export async function verify(token: string): Promise<any> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
} 