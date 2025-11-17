import * as jose from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || "un_secret_tres_securise_pour_jwt_tokens"

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
  
  const secretBytes = new TextEncoder().encode(JWT_SECRET)
  return await jwt.sign(secretBytes)
}

export async function verify(token: string): Promise<any> {
  try {
    const secretBytes = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jose.jwtVerify(token, secretBytes)
    return payload
  } catch (error: any) {
    // Ne logger l'erreur que si c'est vraiment un problème de signature
    // Les erreurs d'expiration sont normales et ne doivent pas être loggées
    if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
      console.error('JWT verification error: Signature verification failed - token may have been signed with a different secret')
    } else if (error.code !== 'ERR_JWT_EXPIRED') {
      console.error('JWT verification error:', error.code || error.message)
    }
    return null
  }
} 