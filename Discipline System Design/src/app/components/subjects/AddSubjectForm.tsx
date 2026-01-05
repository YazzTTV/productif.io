import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { X } from 'lucide-react';
import type { Subject } from './SubjectSetupFlow';

interface AddSubjectFormProps {
  onAdd: (subject: Omit<Subject, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
  existingSubjects: Subject[];
  isModal?: boolean;
}

const COEFFICIENT_OPTIONS = [
  { value: 1, label: 'Low impact', description: 'Less important subject' },
  { value: 2, label: 'Medium impact', description: 'Standard priority' },
  { value: 3, label: 'High impact', description: 'Critical for results' },
] as const;

const PLACEHOLDER_EXAMPLES = [
  'Mathematics',
  'Law',
  'Biology',
  'Economics',
  'Physics',
  'Chemistry',
  'History',
  'Literature',
  'Computer Science',
  'Philosophy',
];

export function AddSubjectForm({ 
  onAdd, 
  onCancel, 
  existingSubjects,
  isModal = false 
}: AddSubjectFormProps) {
  const [subjectName, setSubjectName] = useState('');
  const [coefficient, setCoefficient] = useState<1 | 2 | 3>(2);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = subjectName.trim();
    
    if (!trimmedName) {
      setError('Please enter a subject name');
      return;
    }

    // Check for duplicates
    const isDuplicate = existingSubjects.some(
      s => s.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setError('This subject already exists');
      return;
    }

    onAdd({
      name: trimmedName,
      coefficient,
    });

    // Reset form
    setSubjectName('');
    setCoefficient(2);
    setError('');
  };

  const getRandomPlaceholder = () => {
    const available = PLACEHOLDER_EXAMPLES.filter(
      example => !existingSubjects.some(s => s.name === example)
    );
    return available[Math.floor(Math.random() * available.length)] || 'Subject name';
  };

  const content = (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Subject Name */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-black/70">
          Subject name
        </label>
        <input
          type="text"
          value={subjectName}
          onChange={(e) => {
            setSubjectName(e.target.value);
            setError('');
          }}
          placeholder={getRandomPlaceholder()}
          className="w-full px-4 py-3.5 border border-black/10 rounded-2xl text-lg focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
          autoFocus
        />
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
      </div>

      {/* Coefficient Selector */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-black/70 block mb-1">
            Coefficient (importance)
          </label>
          <p className="text-xs text-black/50">
            This reflects how much this subject matters for your results.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {COEFFICIENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCoefficient(option.value)}
              className={`p-4 rounded-2xl border-2 transition-all ${
                coefficient === option.value
                  ? 'border-[#16A34A] bg-[#16A34A]/5'
                  : 'border-black/10 hover:border-black/20'
              }`}
            >
              <div className="space-y-2">
                {/* Visual indicator */}
                <div className="flex justify-center gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`w-2 h-2 rounded-full transition-all ${
                        level <= option.value
                          ? coefficient === option.value
                            ? 'bg-[#16A34A]'
                            : 'bg-black/30'
                          : 'bg-black/10'
                      }`}
                    />
                  ))}
                </div>

                {/* Number */}
                <div className={`text-2xl font-medium transition-colors ${
                  coefficient === option.value
                    ? 'text-[#16A34A]'
                    : 'text-black/40'
                }`}>
                  {option.value}
                </div>

                {/* Label */}
                <div className="space-y-1">
                  <p className={`text-sm font-medium transition-colors ${
                    coefficient === option.value
                      ? 'text-black'
                      : 'text-black/60'
                  }`}>
                    {option.label}
                  </p>
                  <p className="text-xs text-black/40">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button
          type="submit"
          disabled={!subjectName.trim()}
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-12 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#16A34A]/20 hover:shadow-lg hover:shadow-[#16A34A]/30 transition-all"
        >
          Add subject
        </Button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-full text-black/60 hover:text-black transition-colors text-sm py-3"
          >
            Cancel
          </button>
        )}

        <p className="text-center text-xs text-black/40 pt-2">
          You can edit this later
        </p>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <div className="fixed inset-0 flex items-center justify-center px-6 z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            {onCancel && (
              <button
                onClick={onCancel}
                className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4 text-black/60" />
              </button>
            )}

            <h2 className="text-2xl font-semibold mb-6" style={{ letterSpacing: '-0.03em' }}>
              Add a subject
            </h2>

            {content}
          </motion.div>
        </div>
      </>
    );
  }

  // Full page version
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-lg w-full"
      >
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold mb-2" style={{ letterSpacing: '-0.03em' }}>
            Add a subject
          </h2>
          <p className="text-black/60">
            Start with your most important subjects
          </p>
        </div>

        {content}
      </motion.div>
    </div>
  );
}
