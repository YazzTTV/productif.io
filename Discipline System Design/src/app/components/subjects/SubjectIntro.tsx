import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { BookOpen, GraduationCap, Briefcase, FlaskConical } from 'lucide-react';

interface SubjectIntroProps {
  onStart: () => void;
  onSkip?: () => void;
}

export function SubjectIntro({ onStart, onSkip }: SubjectIntroProps) {
  const exampleSubjects = [
    { icon: GraduationCap, name: 'Mathematics', coef: 3 },
    { icon: BookOpen, name: 'Law', coef: 2 },
    { icon: FlaskConical, name: 'Biology', coef: 2 },
    { icon: Briefcase, name: 'Economics', coef: 1 },
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
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="tracking-tight"
            style={{ letterSpacing: '-0.04em', fontSize: '2rem' }}
          >
            Let's structure your work.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-black/60 text-lg"
          >
            Everything you do is organized by subject.
          </motion.p>
        </div>

        {/* Visual Representation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          {exampleSubjects.map((subject, index) => (
            <motion.div
              key={subject.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white border border-black/10 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  subject.coef === 3 
                    ? 'bg-[#16A34A]/15 text-[#16A34A]'
                    : subject.coef === 2
                    ? 'bg-[#16A34A]/10 text-[#16A34A]/80'
                    : 'bg-black/5 text-black/60'
                }`}>
                  <subject.icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{subject.name}</h3>
                  <p className="text-sm text-black/40">
                    {subject.coef === 3 ? 'High priority' : subject.coef === 2 ? 'Medium priority' : 'Low priority'}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`w-2 h-2 rounded-full ${
                        level <= subject.coef
                          ? 'bg-[#16A34A]'
                          : 'bg-black/10'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="space-y-3"
        >
          <Button
            onClick={onStart}
            className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-14 text-lg shadow-lg shadow-[#16A34A]/20 hover:shadow-xl hover:shadow-[#16A34A]/30 transition-all"
          >
            Add my subjects
          </Button>

          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full text-black/40 hover:text-black/60 transition-colors text-sm py-3"
            >
              Skip for now
            </button>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
