import React, { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export const dynamic = "force-dynamic";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ padding: 32 }}>Chargement...</div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}

