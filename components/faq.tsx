"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

const faqs = [
  {
    question: "Is Productif.io really free?",
    answer: "Yes! Our free plan includes essential features to boost your productivity. Upgrade to Pro anytime for advanced AI insights and unlimited habits."
  },
  {
    question: "How does the AI work?",
    answer: "Our AI analyzes your productivity patterns, habits, and goals to provide personalized recommendations. It learns from your behavior to offer increasingly accurate insights over time."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Absolutely. No long-term contracts or commitments. Cancel your subscription anytime with one click from your settings."
  },
  {
    question: "Is my data private and secure?",
    answer: "Your privacy is our top priority. We use bank-level encryption and never sell your data. You have full control over your information."
  },
  {
    question: "What platforms do you support?",
    answer: "Productif.io is available on iOS, Android, and Web. Your data syncs seamlessly across all devices in real-time."
  },
  {
    question: "Do you offer student discounts?",
    answer: "Yes! Students get 50% off Pro plans. Just verify your student email to unlock the discount."
  }
];

export function Faq() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl text-gray-900 mb-6">
            Frequently Asked
            <span className="block bg-gradient-to-r from-[#00C27A] to-[#00D68F] bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Productif.io
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/90 rounded-2xl border border-gray-100 overflow-hidden backdrop-blur-sm"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg text-gray-900">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={24} className="text-gray-400" />
                </motion.div>
              </button>
              
              <AnimatePresence>
                {openFaqIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-6 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 