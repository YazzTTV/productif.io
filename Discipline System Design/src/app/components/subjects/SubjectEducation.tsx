import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { TrendingUp, Calendar, Target, CheckCircle2 } from 'lucide-react';

interface SubjectEducationProps {
  onComplete: () => void;
}

export function SubjectEducation({ onComplete }: SubjectEducationProps) {
  const features = [
    {
      icon: TrendingUp,
      title: 'Subjects with higher coefficients matter more',
      description: 'Tasks from high-priority subjects appear first in your daily plan.',
    },
    {
      icon: Target,
      title: 'Harder tasks are planned earlier',
      description: 'Difficult work is scheduled when your focus is sharpest.',
    },
    {
      icon: Calendar,
      title: 'Exam proximity increases priority automatically',
      description: 'As deadlines approach, tasks move up automatically.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-lg w-full space-y-12"
      >
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 mx-auto rounded-2xl bg-[#16A34A]/10 flex items-center justify-center"
          >
            <CheckCircle2 className="w-8 h-8 text-[#16A34A]" strokeWidth={2} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="tracking-tight"
            style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}
          >
            How Productif prioritizes your work
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-black/60"
          >
            Your AI agent handles the hard decisions for you.
          </motion.p>
        </div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="bg-white border border-black/10 rounded-2xl p-5 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#16A34A]/10 flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-[#16A34A]" strokeWidth={2} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm leading-snug">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-black/60 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Reassurance Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-[#16A34A]/5 border border-[#16A34A]/20 rounded-2xl p-5"
        >
          <p className="text-sm text-black/70 leading-relaxed">
            You don't need to think about what to work on next. The system handles complexity. You just execute.
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Button
            onClick={onComplete}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-14 text-lg shadow-lg shadow-[#16A34A]/20 hover:shadow-xl hover:shadow-[#16A34A]/30 transition-all"
          >
            Got it
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
