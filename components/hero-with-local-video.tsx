"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState, useRef } from "react"

export function HeroWithLocalVideo() {
  const [videoPlaying, setVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const handlePlayClick = () => {
    setVideoPlaying(true)
    if (videoRef.current) {
      videoRef.current.play()
    }
  }
  
  return (
    <section className="container mx-auto px-4 py-20 text-center relative">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
        Arrête de t'organiser. <span className="text-green-500">Laisse l'IA le faire pour toi.</span>
      </h1>
      <div className="w-full max-w-2xl mx-auto h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent my-6"></div>
      <p className="text-gray-600 text-xl max-w-2xl mx-auto mb-8">
        Ton cerveau mérite mieux que des to-do lists. Productif.io s'occupe de tout.
        <span className="block mt-2 font-medium">Rejoins la whitelist exclusive (1€) et sécurise ton accès à vie pour un tarif préférentiel.</span>
      </p>
      <Button 
        className="bg-green-500 hover:bg-green-600 text-white text-lg px-8 py-6 h-auto"
        onClick={() => window.location.href = 'https://whitelist.productif.io'}
      >
        Sécurise ta place pour 1€
      </Button>
      <p className="text-sm text-gray-500 mt-2">Seulement 150 places disponibles</p>

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