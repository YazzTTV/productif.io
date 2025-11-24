"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Download, ArrowRight, Sparkles, CheckCircle2, Zap, Brain, Trophy, Users } from "lucide-react"

export function DownloadCTA() {
  const router = useRouter();

  const handleCTAClick = () => {
    const params = new URLSearchParams();
    const keep: string[] = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref"];
    keep.forEach(k => {
      const v = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(k) : null;
      if (v) params.set(k, v);
    });
    params.set('offer', 'early-access');
    router.push(`/onboarding/welcome?${params.toString()}`);
  };

  return (
    <section className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-6">
            Start Your Journey
            <span className="block bg-gradient-to-r from-[#00C27A] to-[#00D68F] bg-clip-text text-transparent">
              Today, Free
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Download now and transform your productivity in minutes
          </p>
        </motion.div>

        {/* Main Download CTA Box */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-3xl p-12 text-center shadow-2xl relative overflow-hidden">
            {/* Animated background particles */}
            <div className="absolute inset-0">
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/20 rounded-full"
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

            <div className="relative z-10">
              {/* Badge */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
              >
                <Sparkles size={16} className="text-yellow-300" />
                <span className="text-sm text-white">Limited Time: Free Premium Features</span>
              </motion.div>

              <h3 className="text-4xl md:text-5xl text-white mb-4">
                Get Started in Less Than 60 Seconds
              </h3>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join our growing community and experience 287% productivity boost in your first week
              </p>

              {/* Download Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCTAClick}
                  className="px-10 py-5 bg-white text-[#00C27A] rounded-full shadow-2xl text-xl flex items-center justify-center gap-3 group"
                >
                  <Download size={24} />
                  <span>Start Free Trial</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-yellow-300" />
                  <span>100% Free to start</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={20} className="text-yellow-300" />
                  <span>Setup in 60 seconds</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* What You Get Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Zap size={32} className="text-white" />
            </div>
            <h4 className="text-xl text-gray-900 mb-2">Instant Access</h4>
            <p className="text-gray-600">
              Start tracking your productivity immediately after download. No waiting, no setup hassle.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Brain size={32} className="text-white" />
            </div>
            <h4 className="text-xl text-gray-900 mb-2">AI-Powered Insights</h4>
            <p className="text-gray-600">
              Get personalized productivity recommendations from day one, powered by advanced AI.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Trophy size={32} className="text-white" />
            </div>
            <h4 className="text-xl text-gray-900 mb-2">Premium Features Free</h4>
            <p className="text-gray-600">
              Unlock all premium features for 7 days. Experience the full power of Productif.io.
            </p>
          </motion.div>
        </div>

        {/* Urgency Counter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 bg-gradient-to-r from-orange-50 to-pink-50 px-8 py-4 rounded-full border-2 border-orange-200">
            <Users size={28} className="text-orange-500" />
            <span className="text-lg text-gray-700">
              <span className="text-xl text-orange-600">847 people</span> downloaded in the last 24 hours
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

