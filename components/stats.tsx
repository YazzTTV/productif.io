"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Star } from "lucide-react"

// Hook pour compteur animé
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      setCount(Math.floor(end * percentage));
      
      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  
  return count;
}

export function Stats() {
  const stats = {
    users: useCounter(1500),
    productivity: useCounter(87),
    hours: useCounter(50000),
    rating: 4.9
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-5xl text-gray-900 mb-2">{stats.users.toLocaleString()}+</p>
            <p className="text-gray-600">Early Adopters</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center"
          >
            <p className="text-5xl text-gray-900 mb-2">{stats.productivity}%</p>
            <p className="text-gray-600">Avg. Productivity Boost</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-5xl text-gray-900 mb-2">{(stats.hours / 1000000).toFixed(1)}M+</p>
            <p className="text-gray-600">Focus Hours Tracked</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              <p className="text-5xl text-gray-900">{stats.rating}</p>
              <Star size={32} className="text-yellow-400 fill-yellow-400" />
            </div>
            <p className="text-gray-600">Global Rating</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

