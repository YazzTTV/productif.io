import * as jose from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key"
)

interface SignOptions {
  expirationTime?: Date | string
  noExpiration?: boolean
}

export async function sign(payload: any, options?: SignOptions): Promise<string> {
  let jwt = new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
  
  // Définir l'expiration
  if (options?.noExpiration) {
    // Ne pas définir d'expiration pour un token permanent
  } else if (options?.expirationTime) {
    jwt = jwt.setExpirationTime(options.expirationTime)
  } else {
    // Expiration par défaut plus longue : 1 an au lieu de 7 jours
    jwt = jwt.setExpirationTime('1y')
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