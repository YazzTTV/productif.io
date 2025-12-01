"use client"

import Image from "next/image"
import { Star } from "lucide-react"
import { useEffect } from "react"
import { motion } from "framer-motion"

export function Testimonials() {
  return (
    <section id="testimonials" className="py-32 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-4">
            Loved by ambitious builders
            <span className="block bg-gradient-to-r from-[#00C27A] to-[#00D68F] bg-clip-text text-transparent">
              around the world
            </span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Founders, freelancers and knowledge workers use Productif.io to turn scattered days
            into focused progress.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-[#00C27A] text-[#00C27A]" />
              ))}
            </div>
            <span>4.9/5 average rating · 50K+ users</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0 }}
          >
            <TestimonialCard
              name="Gaetan Silgado"
              role="Infopreneur"
              image="/testimonials/gaetan-silgado.jpg"
              content="As an infopreneur, Productif.io helped me organize and work without distractions. As a result, I generated much more revenue by staying focused on what matters."
              verified
              className="min-h-[420px] flex flex-col"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <BenjaminVideoTestimonial className="min-h-[420px] flex flex-col" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <TestimonialCard
              name="Sabrina"
              role="Freelance Media Buyer"
              image="/testimonials/sabrina.jpg"
              content="I just tried it and it's perfect. I LOVE how the app organizes my tasks and helps me track my habits. It's truly intuitive!"
              className="min-h-[420px] flex flex-col"
            />
          </motion.div>
        </div>
        <div className="mt-12 text-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const params = new URLSearchParams()
              const keep: string[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"]
              keep.forEach(k => {
                const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null
                if (v) params.set(k, v)
              })
              params.set('offer', 'early-access')
              window.location.href = `/onboarding/welcome?${params.toString()}`
            }}
            className="px-8 py-4 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-full shadow-xl text-lg"
          >
            Start Now for Free
          </motion.button>
        </div>
      </div>
    </section>
  )
}

function BenjaminVideoTestimonial({ 
  className = "" 
}: { 
  className?: string 
}) {
  useEffect(() => {
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