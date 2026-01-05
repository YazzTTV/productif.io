import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import type { Subject } from './SubjectSetupFlow';

interface SubjectListProps {
  subjects: Subject[];
  onAddSubject: () => void;
  onEditSubject: (id: string, updates: Partial<Subject>) => void;
  onDeleteSubject: (id: string) => void;
  onContinue: () => void;
}

const COEF_LABELS = {
  1: { label: 'Low', color: 'bg-black/5 text-black/60' },
  2: { label: 'Medium', color: 'bg-[#16A34A]/10 text-[#16A34A]/80' },
  3: { label: 'High', color: 'bg-[#16A34A]/15 text-[#16A34A]' },
};

export function SubjectList({
  subjects,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onContinue,
}: SubjectListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-2xl w-full mx-auto space-y-8 flex-1"
      >
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight" style={{ letterSpacing: '-0.04em' }}>
            Your subjects
          </h1>
          <p className="text-black/60">
            Higher coefficients will be prioritized automatically.
          </p>
        </div>

        {/* Subject List */}
        <div className="space-y-3">
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group bg-white border border-black/10 rounded-2xl p-5 hover:border-black/20 transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                {/* Coefficient Badge */}
                <div className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-sm font-medium ${COEF_LABELS[subject.coefficient].color}`}>
                  {COEF_LABELS[subject.coefficient].label}
                </div>

                {/* Subject Name */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-lg truncate">
                    {subject.name}
                  </h3>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`w-1.5 h-1.5 rounded-full ${
                          level <= subject.coefficient
                            ? 'bg-[#16A34A]'
                            : 'bg-black/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Progress Indicator (empty for now) */}
                <div className="hidden md:flex items-center gap-2 text-sm text-black/40">
                  <div className="w-32 h-2 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#16A34A] w-0" />
                  </div>
                  <span>0 tasks</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingId(subject.id)}
                    className="p-2 rounded-xl hover:bg-black/5 transition-colors"
                    aria-label="Edit subject"
                  >
                    <Edit2 className="w-4 h-4 text-black/60" />
                  </button>
                  <button
                    onClick={() => onDeleteSubject(subject.id)}
                    className="p-2 rounded-xl hover:bg-red-50 transition-colors"
                    aria-label="Delete subject"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                {/* Add Task Button (visible on mobile) */}
                <button
                  className="md:hidden p-2 rounded-xl hover:bg-[#16A34A]/5 transition-colors text-[#16A34A]"
                  aria-label="Add task"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Edit Mode (simple inline edit for coefficient) */}
              {editingId === subject.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-black/10"
                >
                  <p className="text-sm text-black/60 mb-3">Change coefficient:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([1, 2, 3] as const).map((coef) => (
                      <button
                        key={coef}
                        onClick={() => {
                          onEditSubject(subject.id, { coefficient: coef });
                          setEditingId(null);
                        }}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          subject.coefficient === coef
                            ? 'border-[#16A34A] bg-[#16A34A]/5'
                            : 'border-black/10 hover:border-black/20'
                        }`}
                      >
                        <div className="text-lg font-medium">
                          {coef}
                        </div>
                        <div className="text-xs text-black/60">
                          {COEF_LABELS[coef].label}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setEditingId(null)}
                    className="w-full mt-3 text-sm text-black/60 hover:text-black py-2"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </motion.div>
          ))}

          {/* Empty State */}
          {subjects.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-6 border-2 border-dashed border-black/10 rounded-2xl"
            >
              <p className="text-black/40 mb-4">No subjects yet</p>
              <p className="text-sm text-black/30">
                Add your first subject to get started
              </p>
            </motion.div>
          )}

          {/* Add Subject Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: subjects.length * 0.05 + 0.2 }}
            onClick={onAddSubject}
            className="w-full p-4 border-2 border-dashed border-black/10 rounded-2xl hover:border-[#16A34A] hover:bg-[#16A34A]/5 transition-all flex items-center justify-center gap-3 text-black/60 hover:text-[#16A34A]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add another subject</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Fixed Bottom Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="max-w-2xl w-full mx-auto pt-6"
      >
        <Button
          onClick={onContinue}
          disabled={subjects.length === 0}
          className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl h-14 text-lg shadow-lg shadow-[#16A34A]/20 hover:shadow-xl hover:shadow-[#16A34A]/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </Button>

        {subjects.length === 0 && (
          <p className="text-center text-sm text-black/40 mt-3">
            Add at least one subject to continue
          </p>
        )}
      </motion.div>
    </div>
  );
}
