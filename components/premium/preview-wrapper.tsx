"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'

interface PreviewWrapperProps {
  children: React.ReactNode
  isPremium: boolean
  featureName: string
  description: string
  benefits: string[]
}

export function PreviewWrapper({ 
  children, 
  isPremium, 
  featureName, 
  description, 
  benefits 
}: PreviewWrapperProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'

  if (isPremium) {
    return <>{children}</>
  }

  if (!isPreview) {
    // Redirect to preview
    router.replace(`?preview=true`)
    return null
  }

  return (
    <div className="space-y-8">
      {/* Preview header */}
      <div className="text-center space-y-4 py-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#16A34A]/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-[#16A34A]" />
        </div>
        <div>
          <h1 className="tracking-tight mb-2" style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}>
            {featureName}
          </h1>
          <p className="text-black/60">{description}</p>
        </div>
      </div>

      {/* Blurred preview content */}
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 max-w-md text-center space-y-6">
            <div className="space-y-3">
              <h3 className="text-xl tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                Unlock {featureName}
              </h3>
              <p className="text-black/60 text-sm">{description}</p>
            </div>

            <div className="space-y-2 text-left text-sm text-black/60">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                  <p>{benefit}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/dashboard/upgrade')}
                className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-14 text-lg"
              >
                Upgrade to Premium
              </Button>
              <p className="text-xs text-black/40">
                Annual: €3.33/month • Monthly: €7.99/month
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

