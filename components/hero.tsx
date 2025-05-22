"use client"

import { Button } from "@/components/ui/button"
import { AnimatedButton } from "@/components/ui/animated-button"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"

export function Hero() {
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Auto-play video when component mounts
  useEffect(() => {
    // Délai pour s'assurer que la page est chargée
    const timer = setTimeout(() => {
      setVideoPlaying(true)
      // Délai supplémentaire pour s'assurer que l'élément vidéo est monté
      setTimeout(() => {
        if (videoRef.current) {
          // Forcer la lecture directement avec l'API DOM
          const playPromise = videoRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.error("Autoplay prevented:", error);
            });
          }
        }
      }, 500);
    }, 1000)
    
    return () => clearTimeout(timer)
  }, [])
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };
  
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
              <>
                {/* Indicateur de son désactivé */}
                {isMuted && (
                  <div 
                    className="absolute top-4 left-4 z-20 cursor-pointer bg-red-500 rounded-full p-3 animate-pulse hover:scale-110 transition-transform shadow-lg"
                    onClick={toggleMute}
                    title="Cliquez pour activer le son"
                  >
                    <div className="relative w-10 h-10">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                      </svg>
                      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                        <div className="w-12 h-1 bg-white rotate-45 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <video
                  ref={videoRef}
                  src="/videos/presentation-productif.mp4"
                  poster="/placeholder.svg?key=u4w4a"
                  controls
                  autoPlay
                  muted={isMuted}
                  playsInline
                  className="absolute inset-0 w-full h-full"
                  onClick={toggleMute}
                />
              </>
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