import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRemoteJWKSet, jwtVerify } from "jose";

const appleJWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

/**
 * Server-to-Server Notification Endpoint for Sign in with Apple
 * 
 * Apple sends notifications when:
 * - Users change email forwarding preferences
 * - Users delete their app account
 * - Users permanently delete their Apple Account
 * 
 * Documentation: https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user
 */
export async function POST(req: Request) {
  try {
    // Get the JWT from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Apple notification: Missing or invalid Authorization header");
      return NextResponse.json(
        { error: "Missing or invalid Authorization header" },
        { status: 401 }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    
    // Verify the JWT signature using Apple's public keys
    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(jwt, appleJWKS, {
        issuer: "https://appleid.apple.com",
        audience: process.env.APPLE_SERVICE_ID || process.env.NEXT_PUBLIC_APPLE_SERVICE_ID,
      });
      payload = verifiedPayload as any;
    } catch (error: any) {
      console.error("Apple notification: JWT verification failed", error.message);
      return NextResponse.json(
        { error: "Invalid JWT signature" },
        { status: 401 }
      );
    }

    // Extract events from the payload
    const events = payload.events as Array<{
      type: string;
      sub: string;
      email?: string;
      is_private_email?: boolean;
    }>;

    if (!events || !Array.isArray(events)) {
      console.error("Apple notification: Invalid events format", payload);
      return NextResponse.json(
        { error: "Invalid events format" },
        { status: 400 }
      );
    }

    // Process each event
    for (const event of events) {
      const { type, sub, email, is_private_email } = event;
      
      console.log(`Apple notification received: ${type} for user ${sub}`);

      // Find user by email
      // Note: Ideally, you should store the Apple 'sub' (subject) in your User model
      // when users sign in with Apple, so you can find users even if email changes
      // For now, we find by email which works for most cases
      let user = null;

      if (email) {
        user = await prisma.user.findUnique({
          where: { email },
        });
      }

      // If user not found, log a warning but don't fail
      // This can happen if:
      // - User signed in with Apple but email wasn't provided initially
      // - User changed their email and we don't have the Apple 'sub' stored
      if (!user) {
        console.warn(`Apple notification: User not found for sub=${sub}, email=${email || 'N/A'}`);
        // Continue processing other events even if this user wasn't found
        continue;
      }

      switch (type) {
        case "email-disabled":
          // User disabled email forwarding
          if (user && email) {
            // Option 1: Mark email as disabled/private
            await prisma.user.update({
              where: { id: user.id },
              data: {
                // You might want to add a field like: emailDisabled: true
                // Or update email to a placeholder
              },
            });
            console.log(`Email forwarding disabled for user ${user.id}`);
          }
          break;

        case "email-enabled":
          // User enabled email forwarding
          if (user && email) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                email: email, // Update email if it changed
                // emailDisabled: false
              },
            });
            console.log(`Email forwarding enabled for user ${user.id}`);
          }
          break;

        case "consent-withdrawn":
          // User deleted their app account (withdrew consent)
          if (user) {
            // Option 1: Soft delete (recommended for GDPR compliance)
            await prisma.user.update({
              where: { id: user.id },
              data: {
                // Add a deletedAt field or isActive: false
                // Example: deletedAt: new Date()
              },
            });
            
            // Option 2: Hard delete (if required by your policy)
            // await prisma.user.delete({ where: { id: user.id } });
            
            console.log(`Consent withdrawn for user ${user.id}`);
          }
          break;

        case "account-delete":
          // User permanently deleted their Apple Account
          if (user) {
            // Handle account deletion according to your privacy policy
            // You may want to anonymize data instead of deleting
            await prisma.user.update({
              where: { id: user.id },
              data: {
                // Mark as deleted or anonymize
                // Example: deletedAt: new Date(), email: `deleted_${user.id}@deleted.local`
              },
            });
            console.log(`Apple account deleted for user ${user.id}`);
          }
          break;

        default:
          console.warn(`Unknown Apple notification type: ${type}`);
      }
    }

    // Always return 200 OK to acknowledge receipt
    // Apple will retry if you return an error
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error("Apple notification error:", error);
    // Still return 200 to prevent Apple from retrying
    // But log the error for investigation
    return NextResponse.json(
      { error: "Internal server error", received: false },
      { status: 200 }
    );
  }
}

