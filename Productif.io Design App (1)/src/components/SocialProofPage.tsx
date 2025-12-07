import { motion } from 'motion/react';
import { Screen } from '../App';
import { Star, TrendingUp, Users, Award, CheckCircle2, ArrowRight } from 'lucide-react';

interface SocialProofPageProps {
  onNavigate: (screen: Screen) => void;
}

export function SocialProofPage({ onNavigate }: SocialProofPageProps) {
  const caseStudies = [
    {
      name: "Sarah Chen",
      role: "Product Designer",
      image: "👩‍💼",
      before: "Struggling with focus",
      after: "+147% productivity",
      quote: "I went from 2 hours of deep work daily to 6+ hours. Productif.io changed everything.",
      timeframe: "3 weeks",
      metrics: [
        { label: "Deep work", value: "+220%" },
        { label: "Distractions", value: "-81%" }
      ]
    },
    {
      name: "Marcus Rodriguez",
      role: "Startup Founder",
      image: "👨‍💻",
      before: "Burnout & overwhelm",
      after: "3x revenue growth",
      quote: "Finally built the habits that scaled my business. The AI coaching is unreal.",
      timeframe: "2 months",
      metrics: [
        { label: "Tasks done", value: "+340%" },
        { label: "Stress", value: "-72%" }
      ]
    },
    {
      name: "Emma Thompson",
      role: "Medical Student",
      image: "👩‍⚕️",
      before: "Procrastination spiral",
      after: "Top 5% of class",
      quote: "From failing exams to acing them. The habit tracking kept me accountable.",
      timeframe: "6 weeks",
      metrics: [
        { label: "Study time", value: "+290%" },
        { label: "Grades", value: "+45%" }
      ]
    }
  ];

  const testimonials = [
    { text: "This is the productivity app I've been searching for my entire life.", author: "Alex M.", verified: true },
    { text: "Better than a $500/hr coach. The AI actually understands my struggles.", author: "Jordan P.", verified: true },
    { text: "Changed my life in 2 weeks. I wish I found this years ago.", author: "Taylor K.", verified: true },
  ];

  const stats = [
    { value: "87%", label: "Report major improvements", icon: TrendingUp },
    { value: "50K+", label: "Active users worldwide", icon: Users },
    { value: "4.9★", label: "Average rating", icon: Star },
    { value: "2.5hrs", label: "Saved daily per user", icon: Award }
  ];

  return (
    <div className="min-h-[844px] bg-white overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] px-6 py-8 pt-16 relative overflow-hidden">
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.8, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Award className="text-white" size={40} />
          </motion.div>
          <h1 className="text-white mb-3">Trusted by Thousands</h1>
          <p className="text-white/95 text-lg">See what users are saying</p>
        </motion.div>
      </div>

      {/* Trust Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-gray-50 to-white border-y border-gray-100 py-4 px-6"
      >
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="text-center"
            >
              <stat.icon className="text-[#00C27A] mx-auto mb-1" size={18} />
              <p className="text-gray-800 text-sm mb-0.5">{stat.value}</p>
              <p className="text-gray-500 text-xs leading-tight">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="px-6 py-6 space-y-6">
        {/* Case Studies */}
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-800 mb-4"
          >
            Success Stories
          </motion.h2>

          <div className="space-y-4">
            {caseStudies.map((study, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.15 }}
                className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-4xl">{study.image}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-gray-800">{study.name}</p>
                      <CheckCircle2 className="text-[#00C27A]" size={16} />
                    </div>
                    <p className="text-sm text-gray-500">{study.role}</p>
                  </div>
                  <div className="bg-[#00C27A]/10 text-[#00C27A] text-xs px-2 py-1 rounded-full">
                    {study.timeframe}
                  </div>
                </div>

                {/* Transformation */}
                <div className="bg-gradient-to-r from-red-50 to-green-50 rounded-xl p-3 mb-3 flex items-center justify-between">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-1">Before</p>
                    <p className="text-sm text-red-600">{study.before}</p>
                  </div>
                  <ArrowRight className="text-gray-400 mx-2" size={20} />
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-500 mb-1">After</p>
                    <p className="text-sm text-[#00C27A]">{study.after}</p>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-gray-700 italic mb-3 text-sm leading-relaxed">
                  "{study.quote}"
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  {study.metrics.map((metric, i) => (
                    <div key={i} className="bg-white rounded-lg p-2 text-center border border-gray-100">
                      <p className="text-[#00C27A] mb-0.5">{metric.value}</p>
                      <p className="text-xs text-gray-500">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <h2 className="text-gray-800 mb-4">What Users Say</h2>
          <div className="space-y-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + index * 0.1 }}
                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
              >
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm mb-2 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">{testimonial.author}</p>
                  {testimonial.verified && (
                    <div className="flex items-center gap-1 text-xs text-[#00C27A]">
                      <CheckCircle2 size={12} />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Social Proof Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6 }}
          className="bg-gradient-to-br from-[#00C27A] to-[#00D68F] rounded-2xl p-5 text-center relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-white mb-2 relative z-10">⭐⭐⭐⭐⭐</p>
          <p className="text-white text-sm mb-1 relative z-10">
            4.9/5 rating from 12,847 reviews
          </p>
          <p className="text-white/80 text-xs relative z-10">
            Trusted by professionals at Google, Apple, Meta & more
          </p>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="bg-gray-50 rounded-xl p-4 border border-gray-200"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00C27A]/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-[#00C27A]" size={16} />
              </div>
              <p className="text-sm text-gray-700">7-day free trial, cancel anytime</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00C27A]/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-[#00C27A]" size={16} />
              </div>
              <p className="text-sm text-gray-700">No credit card required to start</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#00C27A]/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-[#00C27A]" size={16} />
              </div>
              <p className="text-sm text-gray-700">Money-back guarantee if not satisfied</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CTA Button */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent px-6 py-4">
        <motion.button
          onClick={() => onNavigate('profile-reveal')}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white py-5 rounded-2xl shadow-lg relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <span className="relative text-lg flex items-center justify-center gap-2">
            See My Results
            <ArrowRight size={20} />
          </span>
        </motion.button>
      </div>
    </div>
  );
}