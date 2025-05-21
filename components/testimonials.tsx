"use client"

import Image from "next/image"
import { Star } from "lucide-react"
import { useState, useEffect, useRef } from "react"

export function Testimonials() {
  const [playingVideo, setPlayingVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // Auto-play Benjamin's video when component mounts
  useEffect(() => {
    // Délai plus long pour s'assurer que la page est complètement chargée
    const timer = setTimeout(() => {
      setPlayingVideo(true)
      // Utiliser setTimeout supplémentaire pour être sûr que l'élément vidéo est monté
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
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <span className="text-green-500">— Témoignages</span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
          Ils ont adopté <span className="text-green-500">Productif.io</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        <TestimonialCard
          name="Gaetan Silgado"
          role="Infopreneur"
          image="/testimonials/gaetan-silgado.jpg"
          content="En tant qu'infopreneur, Productif.io m'a permis de m'organiser et de travailler sans distraction. Résultat : j'ai pu générer beaucoup plus de chiffre d'affaires en restant concentré sur l'essentiel."
          verified
          className="min-h-[420px] flex flex-col"
        />
        <BenjaminVideoTestimonial playingVideo={playingVideo} setPlayingVideo={setPlayingVideo} videoRef={videoRef} className="min-h-[420px] flex flex-col" />
        <TestimonialCard
          name="Sabrina"
          role="Media Buyer en freelance"
          image="/testimonials/sabrina.jpg"
          content="Je viens de l'essayer et c'est parfait. J'ADORE comment l'application organise mes tâches et me permet de suivre mes habitudes. C'est vraiment intuitif !"
          className="min-h-[420px] flex flex-col"
        />
      </div>
    </section>
  )
}

function VideoTestimonialCard({
  name,
  role,
  image,
  videoId,
  content,
  playingVideo,
  setPlayingVideo,
}: {
  name: string
  role: string
  image: string
  videoId: string
  content: string
  playingVideo: boolean
  setPlayingVideo: (v: boolean) => void
}) {
  const isPlaying = playingVideo

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Image src={image || "/placeholder.svg"} alt={name} width={48} height={48} className="rounded-full" />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">{name}</h3>
            <Star className="w-4 h-4 fill-green-500 text-green-500" />
          </div>
          <p className="text-gray-500 text-sm">{role}</p>
        </div>
      </div>
      
      <div className="relative aspect-video mb-4 rounded-lg overflow-hidden bg-gray-100">
        {isPlaying ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
            title={`Témoignage de ${name}`}
          />
        ) : (
          <>
            <Image
              src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={`Témoignage de ${name}`}
              width={640}
              height={360}
              className="w-full h-full object-cover"
            />
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/40 transition-colors"
              onClick={() => setPlayingVideo(true)}
            >
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[16px] border-l-green-500 border-b-[8px] border-b-transparent ml-1"></div>
              </div>
            </div>
          </>
        )}
      </div>
      
      <p className="text-gray-600">« {content} »</p>
    </div>
  )
}

function BenjaminVideoTestimonial({ 
  playingVideo, 
  setPlayingVideo, 
  videoRef,
  className = "" 
}: { 
  playingVideo: boolean, 
  setPlayingVideo: (v: boolean) => void, 
  videoRef: React.RefObject<HTMLVideoElement>,
  className?: string 
}) {
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Image src="/testimonials/benjamin-courdrais.jpg" alt="Benjamin Courdrais" width={48} height={48} className="rounded-full" />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">Benjamin Courdrais</h3>
            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[8px]">t</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm">Entrepreneur</p>
        </div>
      </div>
      <div className="relative aspect-video mb-4 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        {!playingVideo ? (
          <div className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30 hover:bg-black/40 transition-colors z-10" onClick={() => setPlayingVideo(true)}>
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[16px] border-l-green-500 border-b-[8px] border-b-transparent ml-1"></div>
            </div>
          </div>
        ) : null}
        
        {/* Indicateur de son désactivé */}
        {playingVideo && isMuted && (
          <div 
            className="absolute bottom-14 right-14 z-20 cursor-pointer bg-red-500 rounded-full p-2 animate-pulse hover:scale-110 transition-transform"
            onClick={toggleMute}
            title="Cliquez pour activer le son"
          >
            <div className="relative w-6 h-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <div className="w-8 h-0.5 bg-white rotate-45 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          src="/videos/benjamin-temoignage.mp4"
          poster="/placeholder.svg"
          controls
          autoPlay={playingVideo}
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
          style={{ display: playingVideo ? 'block' : 'none' }}
          onEnded={() => setPlayingVideo(false)}
          onClick={toggleMute}
        />
        {!playingVideo && (
          <Image
            src="/placeholder.svg"
            alt="Miniature vidéo Benjamin Courdrais"
            fill
            className="object-cover"
          />
        )}
      </div>
      <p className="text-gray-600">« En tant que fondateur de startup, je travaille sur plusieurs projets en parallèle. Productif.io m'a fait gagner un temps précieux en centralisant toutes mes tâches et objectifs. »</p>
    </div>
  )
}

function TestimonialCard({
  name,
  role,
  image,
  content,
  verified = false,
  platform = "",
  className = ""
}: {
  name: string
  role: string
  image: string
  content: string
  verified?: boolean
  platform?: string
  className?: string
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <Image src={image || "/placeholder.svg"} alt={name} width={48} height={48} className="rounded-full" />
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900">{name}</h3>
            {verified && <Star className="w-4 h-4 fill-green-500 text-green-500" />}
            {platform === "twitter" && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px]">t</span>
              </div>
            )}
            {platform === "linkedin" && (
              <div className="w-4 h-4 bg-blue-700 rounded-full flex items-center justify-center">
                <span className="text-white text-[8px]">in</span>
              </div>
            )}
          </div>
          <p className="text-gray-500 text-sm">{role}</p>
        </div>
      </div>
      <p className="text-gray-600">« {content} »</p>
    </div>
  )
} 