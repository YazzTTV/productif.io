"use client"

import Image from "next/image"
import { Star } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

export function Testimonials() {
  // Suppression des états et des refs qui ne sont plus nécessaires
  // Le player Voomly gère son propre état de lecture
  
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="text-center mb-16">
        <span className="text-green-500">— Testimonials</span>
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
          They chose <span className="text-green-500">Productif.io</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        <TestimonialCard
          name="Gaetan Silgado"
          role="Infopreneur"
          image="/testimonials/gaetan-silgado.jpg"
          content="As an infopreneur, Productif.io helped me organize and work without distractions. As a result, I generated much more revenue by staying focused on what matters."
          verified
          className="min-h-[420px] flex flex-col"
        />
        <BenjaminVideoTestimonial className="min-h-[420px] flex flex-col" />
        <TestimonialCard
          name="Sabrina"
          role="Freelance Media Buyer"
          image="/testimonials/sabrina.jpg"
          content="I just tried it and it’s perfect. I LOVE how the app organizes my tasks and helps me track my habits. It’s truly intuitive!"
          className="min-h-[420px] flex flex-col"
        />
      </div>
      <div className="mt-10 text-center">
        <Button 
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3"
          onClick={() => {
            const params = new URLSearchParams()
            params.set('offer','early-access')
            params.set('billing','monthly')
            window.location.href = `/onboarding?${params.toString()}`
          }}
        >
          Start Now for Free
        </Button>
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
  className = "" 
}: { 
  className?: string 
}) {
  // Ajouter le script Voomly dans le head lors du montage du composant
  useEffect(() => {
    // Vérifier si le script existe déjà
    if (!document.querySelector('script[src="https://embed.voomly.com/embed/embed-build.js"]')) {
      const script = document.createElement('script');
      script.src = "https://embed.voomly.com/embed/embed-build.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

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
      
      <div className="mb-4">
        <div className="voomly-embed" data-id="NnKKLXyQmwRrf284PnBRA8RqZwgkpD52kTMVRAkPHcr_fxEwC" data-ratio="0.566667" data-type="v" data-skin-color="rgba(0,255,61,1)" data-shadow="" style={{ width: "100%", aspectRatio: "0.566667 / 1", background: "linear-gradient(45deg, rgb(142, 150, 164) 0%, rgb(201, 208, 222) 100%)", borderRadius: "10px" }}></div>
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