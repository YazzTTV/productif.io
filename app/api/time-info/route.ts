import { NextResponse } from "next/server"

/**
 * Endpoint pour retourner les informations de temps du serveur
 * Utilisé pour diagnostiquer les problèmes de fuseau horaire
 */
export async function GET() {
  const now = new Date()
  
  const timezoneOffset = now.getTimezoneOffset()
  const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  return NextResponse.json({
    serverTime: now.toISOString(),
    localTimeString: now.toString(),
    timezone: serverTimezone,
    timezoneOffset: timezoneOffset,
    utcTime: new Date(now.getTime() + timezoneOffset * 60000).toISOString()
  })
} 