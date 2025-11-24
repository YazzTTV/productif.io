"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export function HeroWithLocalVideo() {
  const [videoPlaying, setVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()
  
  const handlePlayClick = () => {
    setVideoPlaying(true)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }
  
  return (
    <section className="container mx-auto px-4 py-20 text-center relative">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
        Stop trying to organize everything. <span className="text-green-500">Let AI do it for you.</span>
      </h1>
      <div className="w-full max-w-2xl mx-auto h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent my-6"></div>
      <p className="text-gray-600 text-xl max-w-2xl mx-auto mb-8">
        Your brain deserves better than endless to-do lists. Productif.io handles it for you.
        <span className="block mt-2 font-medium">Join the exclusive waitlist (€1) and lock in lifetime access at a preferential rate.</span>
      </p>
      <Button 
        className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-6 h-auto"
        onClick={() => {
          const params = new URLSearchParams()
          const keep: string[] = ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","ref"]
          keep.forEach(k => {
            const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null
            if (v) params.set(k, v)
          })
          params.set('offer','early-access')
          router.push(`/onboarding/welcome?${params.toString()}`)
        }}
      >
        Start Now for Free
      </Button>
      <p className="text-sm text-gray-500 mt-2">Only 150 spots available</p>

      <div className="mt-16 relative">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <div className="relative aspect-video">
            <video 
              ref={videoRef}
              src="/videos/productif-demo.mp4" 
              poster="/placeholder.svg?key=u4w4a"
              className="w-full h-full object-cover"
              controls={videoPlaying}
              playsInline
            ></video>
            
            {!videoPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="w-20 h-20 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-white transition-colors"
                  onClick={handlePlayClick}
                >
                  <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-green-500 border-b-[10px] border-b-transparent ml-2"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
} 