import { motion } from 'motion/react';

export function AnimatedBackground() {
  const particles = Array.from({ length: 20 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-[#00C27A] rounded-full opacity-20"
          initial={{
            x: Math.random() * 390,
            y: Math.random() * 844,
          }}
          animate={{
            x: Math.random() * 390,
            y: Math.random() * 844,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}