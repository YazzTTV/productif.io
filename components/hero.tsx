"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useState, useEffect } from "react"

// Composant dédié pour le player vidéo (mobile-friendly)
const VideoPlayer = () => {
  // Charger le script Voomly
  useEffect(() => {
    if (!document.querySelector('script[src="https://embed.voomly.com/embed/embed-build.js"]')) {
      const script = document.createElement('script');
      script.src = "https://embed.voomly.com/embed/embed-build.js";
      script.async = true;
      document.head.appendChild(script);
  }
  }, []);

  // Version unifiée : Voomly Player pour tous les appareils
  return (
      <div 
        className="voomly-embed absolute inset-0 w-full h-full" 
        data-id="oMPeVAFqWACU1YsR6exYat3UA8hPfEL6AO4QRTtxZO5aBkUVB" 
        data-ratio="1.777778" 
        data-type="v" 
        data-skin-color="rgba(0,255,79,1)" 
        data-shadow=""
        style={{ 
          width: '100%', 
          aspectRatio: '1.77778 / 1', 
          background: 'linear-gradient(45deg, rgb(142, 150, 164) 0%, rgb(201, 208, 222) 100%)', 
          borderRadius: '10px'
        }}
      />
  )
}

export function Hero() {
  const [videoPlaying, setVideoPlaying] = useState(false)
  
  // Auto-play video when component mounts
  useEffect(() => {
    // Délai pour s'assurer que la page est chargée
    const timer = setTimeout(() => {
      setVideoPlaying(true)
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
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
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg border border-gray-200 max-w-6xl mx-auto">
          <div className="relative aspect-video">
            {videoPlaying ? (
              <VideoPlayer />
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
      
      {/* Section de waitlist en dessous de la vidéo */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-700 text-center mb-4">
          Rejoins la waitlist exclusive (1€) et sécurise ton accès à vie pour un tarif préférentiel.
        </p>
        <div className="flex justify-center">
          <Button 
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3"
            onClick={() => window.location.href = '/waitlist'}
          >
            Rejoindre la waitlist pour 1€
          </Button>
        </div>
      </div>
    </section>
  )
} 