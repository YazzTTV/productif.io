import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
)

interface SignOptions {
  expirationTime?: Date | string
}

export async function sign(payload: any, options?: SignOptions): Promise<string> {
  let jwt = new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
  
  // Définir l'expiration
  if (options?.expirationTime) {
    jwt = jwt.setExpirationTime(options.expirationTime)
  } else {
    jwt = jwt.setExpirationTime('7d')
  }
  
  return await jwt.sign(JWT_SECRET)
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