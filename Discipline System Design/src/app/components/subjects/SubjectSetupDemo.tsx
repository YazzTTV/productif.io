import { useState } from 'react';
import { SubjectSetupFlow } from './SubjectSetupFlow';
import { useSubjects } from '../../hooks/useSubjects';
import type { Subject } from './SubjectSetupFlow';
import { Button } from '../ui/button';
import { RotateCcw } from 'lucide-react';

/**
 * Demo component to test the Subject Setup Flow
 * Shows the complete journey: Intro → Add → List → Education → Display Results
 */

export function SubjectSetupDemo() {
  const { subjects, addSubject, updateSubject, deleteSubject, clearAllSubjects } = useSubjects();
  const [showFlow, setShowFlow] = useState(!subjects.length);
  const [completedSubjects, setCompletedSubjects] = useState<Subject[]>([]);

  const handleComplete = (newSubjects: Subject[]) => {
    setCompletedSubjects(newSubjects);
    setShowFlow(false);
    
    // Save to global state
    newSubjects.forEach(subject => {
      if (!subjects.find(s => s.id === subject.id)) {
        addSubject(subject);
      }
    });
  };

  const handleReset = () => {
    if (confirm('Clear all subjects and restart?')) {
      clearAllSubjects();
      setCompletedSubjects([]);
      setShowFlow(true);
    }
  };

  const handleRestart = () => {
    setShowFlow(true);
  };

  if (showFlow) {
    return (
      <SubjectSetupFlow
        onComplete={handleComplete}
        onSkip={() => {
          setShowFlow(false);
          alert('Setup skipped');
        }}
        initialSubjects={subjects}
      />
    );
  }

  // Results display
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              Subject Setup Complete
            </h1>
            <p className="text-black/60">
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''} configured
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleRestart}
              variant="outline"
              className="rounded-2xl"
            >
              Edit Subjects
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="rounded-2xl text-red-600 border-red-200 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All
            </Button>
          </div>
        </div>

        {/* Subjects Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map((subject) => (
            <div
              key={subject.id}
              className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-xl font-medium">{subject.name}</h3>
                <div className={`px-3 py-1 rounded-xl text-sm font-medium ${
                  subject.coefficient === 3
                    ? 'bg-[#16A34A]/15 text-[#16A34A]'
                    : subject.coefficient === 2
                    ? 'bg-[#16A34A]/10 text-[#16A34A]/80'
                    : 'bg-black/5 text-black/60'
                }`}>
                  Coef {subject.coefficient}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-black/60">
                  <span>Priority:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((level) => (
                      <div
                        key={level}
                        className={`w-2 h-2 rounded-full ${
                          level <= subject.coefficient
                            ? 'bg-[#16A34A]'
                            : 'bg-black/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-black/40">
                  Created {new Date(subject.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-black/5">
                <button className="w-full py-2 text-sm text-[#16A34A] hover:bg-[#16A34A]/5 rounded-xl transition-colors">
                  Add task
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {subjects.length === 0 && (
          <div className="text-center py-16 px-6 border-2 border-dashed border-black/10 rounded-3xl">
            <p className="text-black/40 mb-4 text-lg">No subjects yet</p>
            <p className="text-sm text-black/30 mb-6">
              Start the setup flow to add your subjects
            </p>
            <Button
              onClick={handleRestart}
              className="bg-[#16A34A] hover:bg-[#16A34A]/90 text-white rounded-2xl"
            >
              Start Setup
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-black/5 rounded-2xl p-6 space-y-4">
          <h3 className="font-medium">Integration Guide</h3>
          <div className="space-y-2 text-sm text-black/70">
            <p>• Use <code className="px-2 py-1 bg-white rounded text-xs">SubjectSetupFlow</code> component</p>
            <p>• Subjects are saved to localStorage automatically</p>
            <p>• Use <code className="px-2 py-1 bg-white rounded text-xs">useSubjects()</code> hook to manage state</p>
            <p>• Integrate after onboarding or in tutorial</p>
          </div>

          <div className="pt-4 border-t border-black/10">
            <p className="text-xs text-black/50 font-mono">
              localStorage key: 'productif_subjects'
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
