"use client"

import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import Image from "next/image"
import { useState } from "react"

export function Hero() {
  const [videoPlaying, setVideoPlaying] = useState(false)
  
  // ID de la vidéo YouTube
  const videoId = "aLtNDMv0CnE"
  
  return (
    <section className="container mx-auto px-4 py-20 text-center relative">
      <h1 className="text-4xl md:text-6xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
        Arrête de t'organiser. <span className="text-green-500">Laisse l'IA le faire pour toi.</span>
      </h1>
      <div className="w-full max-w-2xl mx-auto h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent my-6"></div>
      <p className="text-gray-600 text-xl max-w-2xl mx-auto mb-8">
        Ton cerveau mérite mieux que des to-do lists. Productif.io s'occupe de tout.
      </p>

      <div className="mt-8 relative">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <div className="relative aspect-video">
            {videoPlaying ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                title="Productif.io Présentation"
              ></iframe>
            ) : (
              <>
                <Image
                  src="/placeholder.svg?key=u4w4a"
                  alt="Interface de Productif.io"
                  width={1280}
                  height={720}
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="w-20 h-20 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer shadow-md hover:bg-white transition-colors"
                    onClick={() => setVideoPlaying(true)}
                  >
                    <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[20px] border-l-green-500 border-b-[10px] border-b-transparent ml-2"></div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Section de whitelist en dessous de la vidéo */}
      <div className="mt-16 max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Rejoins la whitelist exclusive (1€) et sécurise ton accès à vie pour un tarif préférentiel.
        </h2>
        
        <div className="mt-8">
          <AnimatedButton 
            className="text-lg px-8 py-4 bg-green-500 hover:bg-green-600"
            onClick={() => window.location.href = 'https://whitelist.productif.io'}
          >
            Sécurise ta place pour 1€
          </AnimatedButton>
        </div>
        
        <p className="text-gray-600 mt-4">Seulement 150 places disponibles</p>
      </div>
    </section>
  )
} 