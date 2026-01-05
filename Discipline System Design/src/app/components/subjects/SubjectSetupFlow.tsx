import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SubjectIntro } from './SubjectIntro';
import { AddSubjectForm } from './AddSubjectForm';
import { SubjectList } from './SubjectList';
import { SubjectEducation } from './SubjectEducation';

export interface Subject {
  id: string;
  name: string;
  coefficient: 1 | 2 | 3;
  color?: string;
  createdAt: string;
}

interface SubjectSetupFlowProps {
  onComplete: (subjects: Subject[]) => void;
  onSkip?: () => void;
  initialSubjects?: Subject[];
}

type FlowStep = 'intro' | 'add-subject' | 'list' | 'education';

export function SubjectSetupFlow({ 
  onComplete, 
  onSkip,
  initialSubjects = [] 
}: SubjectSetupFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('intro');
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const handleAddSubject = (subject: Omit<Subject, 'id' | 'createdAt'>) => {
    const newSubject: Subject = {
      ...subject,
      id: `subject_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString(),
    };
    
    setSubjects([...subjects, newSubject]);
    setIsAddingSubject(false);
    
    // Move to list view after first subject
    if (currentStep === 'add-subject') {
      setCurrentStep('list');
    }
  };

  const handleEditSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleDeleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleContinue = () => {
    if (subjects.length === 0) {
      // Force adding at least one subject
      setCurrentStep('add-subject');
      return;
    }
    setCurrentStep('education');
  };

  const handleComplete = () => {
    onComplete(subjects);
  };

  return (
    <div className="min-h-screen bg-white">
      <AnimatePresence mode="wait">
        {currentStep === 'intro' && (
          <SubjectIntro
            key="intro"
            onStart={() => setCurrentStep('add-subject')}
            onSkip={onSkip}
          />
        )}

        {currentStep === 'add-subject' && (
          <AddSubjectForm
            key="add-subject"
            onAdd={handleAddSubject}
            onCancel={subjects.length > 0 ? () => setCurrentStep('list') : undefined}
            existingSubjects={subjects}
          />
        )}

        {currentStep === 'list' && (
          <SubjectList
            key="list"
            subjects={subjects}
            onAddSubject={() => setIsAddingSubject(true)}
            onEditSubject={handleEditSubject}
            onDeleteSubject={handleDeleteSubject}
            onContinue={handleContinue}
          />
        )}

        {currentStep === 'education' && (
          <SubjectEducation
            key="education"
            onComplete={handleComplete}
          />
        )}
      </AnimatePresence>

      {/* Add Subject Modal Overlay */}
      {isAddingSubject && currentStep === 'list' && (
        <div className="fixed inset-0 z-50">
          <AddSubjectForm
            onAdd={(subject) => {
              handleAddSubject(subject);
              setIsAddingSubject(false);
            }}
            onCancel={() => setIsAddingSubject(false)}
            existingSubjects={subjects}
            isModal
          />
        </div>
      )}
    </div>
  );
}
