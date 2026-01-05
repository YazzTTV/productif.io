import { useState, useEffect } from 'react';
import type { Subject } from '../components/subjects/SubjectSetupFlow';

const SUBJECTS_STORAGE_KEY = 'productif_subjects';

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    // Load from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(SUBJECTS_STORAGE_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse subjects:', e);
        }
      }
    }
    return [];
  });

  // Save to localStorage whenever subjects change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects));
    }
  }, [subjects]);

  const addSubject = (subject: Omit<Subject, 'id' | 'createdAt'>) => {
    const newSubject: Subject = {
      ...subject,
      id: `subject_${Date.now()}_${Math.random()}`,
      createdAt: new Date().toISOString(),
    };
    setSubjects([...subjects, newSubject]);
    return newSubject;
  };

  const updateSubject = (id: string, updates: Partial<Subject>) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const getSubjectById = (id: string) => {
    return subjects.find(s => s.id === id);
  };

  const getSubjectsByCoefficient = (coefficient: 1 | 2 | 3) => {
    return subjects.filter(s => s.coefficient === coefficient);
  };

  const getSortedSubjects = () => {
    // Sort by coefficient (high to low), then by name
    return [...subjects].sort((a, b) => {
      if (a.coefficient !== b.coefficient) {
        return b.coefficient - a.coefficient;
      }
      return a.name.localeCompare(b.name);
    });
  };

  const clearAllSubjects = () => {
    setSubjects([]);
  };

  return {
    subjects,
    addSubject,
    updateSubject,
    deleteSubject,
    getSubjectById,
    getSubjectsByCoefficient,
    getSortedSubjects,
    clearAllSubjects,
    hasSubjects: subjects.length > 0,
  };
}
