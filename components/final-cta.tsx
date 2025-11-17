"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Download, ArrowRight, CheckCircle2 } from "lucide-react"

export function FinalCTA() {
  const router = useRouter();

  const handleCTAClick = () => {
    const params = new URLSearchParams();
    const keep: string[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"];
    keep.forEach(k => {
      const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null;
      if (v) params.set(k, v);
    });
    params.set('offer', 'early-access');
    router.push(`/onboarding?${params.toString()}`);
  };

  return (
    <section className="py-32 bg-gradient-to-br from-[#00C27A] to-[#00D68F] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl md:text-6xl text-white mb-6">
            Ready to 3x Your Productivity?
          </h2>
          <p className="text-xl text-white/90 mb-12">
            Join our community of productive people who transformed their lives with Productif.io
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCTAClick}
              className="px-10 py-5 bg-white text-[#00C27A] rounded-full shadow-2xl text-xl flex items-center gap-3 group"
            >
              <Download size={24} />
              <span>Start Free Trial</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={20} />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

