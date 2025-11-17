"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { Sparkles, Download, ArrowRight, CheckCircle2, PlayCircle, ChevronDown, X, Send, TrendingUp, Trophy } from "lucide-react"

// Composant dédié pour le player vidéo (mobile-friendly)
const VideoPlayer = ({ isModal = false }: { isModal?: boolean }) => {
  useEffect(() => {
    if (!document.querySelector('script[src="https://embed.voomly.com/embed/embed-build.js"]')) {
      const script = document.createElement('script');
      script.src = "https://embed.voomly.com/embed/embed-build.js";
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  // Pour la modale, on utilise un format plus vertical pour montrer le téléphone
  if (isModal) {
    return (
      <div 
        className="voomly-embed w-full h-full" 
        data-id="oMPeVAFqWACU1YsR6exYat3UA8hPfEL6AO4QRTtxZO5aBkUVB" 
        data-ratio="0.5625" 
        data-type="v" 
        data-skin-color="rgba(0,255,79,1)" 
        data-shadow=""
        style={{ 
          width: '100%', 
          aspectRatio: '0.5625 / 1', 
          background: 'linear-gradient(45deg, rgb(142, 150, 164) 0%, rgb(201, 208, 222) 100%)', 
          borderRadius: '10px',
          maxWidth: '400px',
          margin: '0 auto'
        }}
      />
    )
  }

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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const router = useRouter()
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 300], [1, 0])
  const scale = useTransform(scrollY, [0, 300], [1, 0.8])

  const handleCTAClick = () => {
    const params = new URLSearchParams()
    const keep: string[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"]
    keep.forEach(k => {
      const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null
      if (v) params.set(k, v)
    })
    params.set('offer', 'early-access')
    router.push(`/onboarding?${params.toString()}`)
  }
  
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-[#00C27A]/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Copy */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00C27A]/10 to-[#00D68F]/10 px-4 py-2 rounded-full mb-6"
            >
              <Sparkles size={16} className="text-[#00C27A]" />
              <span className="text-sm text-gray-700">#1 Productivity App of 2025</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl text-gray-900 mb-6 leading-tight"
            >
              Master Your
              <span className="block bg-gradient-to-r from-[#00C27A] to-[#00D68F] bg-clip-text text-transparent">
                Productivity
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-600 mb-8 leading-relaxed"
            >
              Join thousands of high-achievers using AI-powered insights to boost productivity by 287% and achieve their biggest goals.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 mb-8"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 194, 122, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCTAClick}
                className="px-8 py-4 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-full shadow-xl text-lg flex items-center justify-center gap-2 group"
              >
                <Download size={24} />
                <span>Start Free Trial</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVideoModalOpen(true)}
                className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-full shadow-lg text-lg flex items-center justify-center gap-2 hover:border-[#00C27A] transition-colors"
              >
                <PlayCircle size={24} />
                <span>Watch Demo</span>
              </motion.button>
            </motion.div>

            {/* Trust Signals */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-6 text-sm text-gray-600"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#00C27A]" />
                <span>Free 7-day trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-[#00C27A]" />
                <span>Cancel anytime</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - AI Assistant Phone Demo */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Phone mockup with AI Assistant Chat */}
            <div className="relative">
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10"
              >
                {/* Phone frame */}
                <div className="relative mx-auto w-[350px] h-[700px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-[3rem] shadow-[0_0_80px_rgba(0,194,122,0.3)] p-4 border-8 border-gray-800">
                  {/* Notch with glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-900 rounded-b-3xl z-20">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-700 rounded-full"></div>
                  </div>
                  
                  {/* Screen content - AI Assistant Chat */}
                  <div className="w-full h-full bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-[2rem] overflow-hidden shadow-inner relative">
                    {/* Header with AI Avatar */}
                    <div className="relative z-10 bg-white/60 backdrop-blur-sm border-b border-gray-200 px-4 py-4">
                      <div className="flex items-center gap-3">
                        <motion.div
                          animate={{ 
                            y: [0, -3, 0],
                            scale: [1, 1.05, 1]
                          }}
                          transition={{ 
                            duration: 3, 
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                          className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg relative p-2"
                        >
                          <Image
                            src="/P_tech_letter_logo_TEMPLATE-removebg-preview.png"
                            alt="AI"
                            width={40}
                            height={40}
                            className="w-full h-full object-contain"
                          />
                          <motion.div
                            className="absolute inset-0 bg-[#00C27A]/10 rounded-full"
                            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          />
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-sm text-gray-900 font-medium">AI Productivity Coach</h3>
                          <p className="text-xs text-[#00C27A]">Always learning, always improving</p>
                        </div>
                        <Sparkles size={16} className="text-[#00C27A]" />
                      </div>
                    </div>

                    {/* Scrollable Messages */}
                    <div className="relative z-10 h-[calc(100%-170px)] overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0, 194, 122, 0.3) transparent' }}>
                      {/* AI Welcome Message */}
                      <motion.div 
                        className="flex justify-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="max-w-[85%] rounded-3xl rounded-tl-none px-4 py-3 bg-gradient-to-br from-[#00C27A]/10 to-[#00C27A]/5 text-gray-800 border border-[#00C27A]/20 shadow-sm">
                          <p className="text-sm leading-relaxed">Hi! I'm your AI productivity coach. I'm here to help you optimize your day and unlock your full potential. How can I assist you?</p>
                        </div>
                      </motion.div>

                      {/* User Message 1 */}
                      <motion.div 
                        className="flex justify-end"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                      >
                        <div className="max-w-[75%] rounded-3xl rounded-tr-none px-4 py-3 bg-gradient-to-br from-[#00C27A] to-[#00D68F] text-white shadow-lg">
                          <p className="text-sm">How can I improve my focus today?</p>
                        </div>
                      </motion.div>

                      {/* AI Response 1 */}
                      <motion.div 
                        className="flex justify-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <div className="max-w-[85%] rounded-3xl rounded-tl-none px-4 py-3 bg-gradient-to-br from-[#00C27A]/10 to-[#00C27A]/5 text-gray-800 border border-[#00C27A]/20 shadow-sm">
                          <p className="text-sm leading-relaxed mb-2">Based on your patterns, you're most productive between 9-11 AM. I recommend:</p>
                          <div className="space-y-1.5 ml-3">
                            <div className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-[#00C27A] rounded-full mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-gray-700">Start with your hardest task first</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-[#00C27A] rounded-full mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-gray-700">Use 25-minute focus blocks</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-[#00C27A] rounded-full mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-gray-700">Take breaks between sessions</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      {/* User Message 2 */}
                      <motion.div 
                        className="flex justify-end"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <div className="max-w-[75%] rounded-3xl rounded-tr-none px-4 py-3 bg-gradient-to-br from-[#00C27A] to-[#00D68F] text-white shadow-lg">
                          <p className="text-sm">What about my goals?</p>
                        </div>
                      </motion.div>

                      {/* AI Response 2 with Stats */}
                      <motion.div 
                        className="flex justify-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 }}
                      >
                        <div className="max-w-[85%] rounded-3xl rounded-tl-none px-4 py-3 bg-gradient-to-br from-[#00C27A]/10 to-[#00C27A]/5 text-gray-800 border border-[#00C27A]/20 shadow-sm">
                          <p className="text-sm leading-relaxed mb-3">You're making great progress! Here's your weekly overview:</p>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div className="bg-white/60 rounded-lg p-2 border border-[#00C27A]/10">
                              <p className="text-xs text-gray-600">Completed</p>
                              <p className="text-lg text-[#00C27A] font-semibold">12/15</p>
                            </div>
                            <div className="bg-white/60 rounded-lg p-2 border border-purple-200/50">
                              <p className="text-xs text-gray-600">Streak</p>
                              <p className="text-lg text-purple-600 font-semibold">42 days</p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-gray-700">You're on track to reach your monthly goal! Keep up the momentum 🚀</p>
                        </div>
                      </motion.div>

                      {/* User Message 3 */}
                      <motion.div 
                        className="flex justify-end"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 }}
                      >
                        <div className="max-w-[75%] rounded-3xl rounded-tr-none px-4 py-3 bg-gradient-to-br from-[#00C27A] to-[#00D68F] text-white shadow-lg">
                          <p className="text-sm">Show me insights</p>
                        </div>
                      </motion.div>

                      {/* AI Response 3 with Chart */}
                      <motion.div 
                        className="flex justify-start"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.4 }}
                      >
                        <div className="max-w-[85%] rounded-3xl rounded-tl-none px-4 py-3 bg-gradient-to-br from-[#00C27A]/10 to-[#00C27A]/5 text-gray-800 border border-[#00C27A]/20 shadow-sm">
                          <p className="text-sm leading-relaxed mb-3">Your productivity is trending upward!</p>
                          
                          <div className="bg-white/60 rounded-lg p-3 mb-2 border border-[#00C27A]/10">
                            <div className="flex items-end justify-between gap-1 h-12">
                              {[45, 60, 55, 75, 70, 85, 90].map((height, i) => (
                                <motion.div
                                  key={i}
                                  className="flex-1 bg-gradient-to-t from-[#00C27A] to-[#00D68F] rounded-t"
                                  initial={{ height: 0 }}
                                  animate={{ height: `${height}%` }}
                                  transition={{ delay: 1.5 + i * 0.05, duration: 0.3 }}
                                />
                              ))}
                            </div>
                            <div className="flex justify-between mt-1">
                              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                <span key={i} className="text-[8px] text-gray-500">{day}</span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <TrendingUp size={12} className="text-[#00C27A]" />
                            <p className="text-xs text-gray-700">+23% from last week</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Input Area */}
                    <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/60 backdrop-blur-sm border-t border-gray-200 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
                          <input 
                            type="text" 
                            placeholder="Ask me anything..."
                            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-500 outline-none"
                            disabled
                          />
                        </div>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="w-9 h-9 bg-gradient-to-r from-[#00C27A] to-[#00D68F] rounded-full flex items-center justify-center shadow-lg cursor-pointer"
                        >
                          <Send size={16} className="text-white" />
                        </motion.div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Floating elements */}
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-xl p-4 z-20 hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Productivity</p>
                    <p className="text-xl text-gray-900 font-semibold">+287%</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-4 -left-8 bg-white rounded-2xl shadow-xl p-4 z-20 hidden md:block"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                    <Trophy size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Achievement</p>
                    <p className="text-sm text-gray-900 font-semibold">Top 1% 🏆</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        style={{ opacity, scale }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-sm text-gray-400">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown size={24} className="text-gray-400" />
        </motion.div>
      </motion.div>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => setIsVideoModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-2 max-w-4xl w-full relative"
            >
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl hover:bg-gray-100 transition-colors z-10"
                aria-label="Close video modal"
              >
                <X size={24} className="text-gray-700" />
              </button>
              
              <div className="bg-gray-900 rounded-2xl overflow-hidden relative flex items-center justify-center min-h-[600px]">
                <VideoPlayer isModal={true} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
} 