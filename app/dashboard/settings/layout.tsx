"use client"

import React from "react"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Le nouveau design n'a plus besoin de navigation latérale
  // Tout est sur une seule page avec le nouveau design
  return <>{children}</>
} 