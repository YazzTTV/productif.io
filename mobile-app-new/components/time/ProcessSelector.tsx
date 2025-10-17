import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Select } from '../ui/Select';
import { apiCall } from '../../lib/api';

interface Process {
  id: string;
  name: string;
  description: string;
  steps: string;
}

interface ProcessSelectorProps {
  onSelect: (process: Process | null) => void;
  refreshTrigger?: number; // Pour forcer le rechargement
}

export function ProcessSelector({ onSelect, refreshTrigger }: ProcessSelectorProps) {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedValue, setSelectedValue] = useState<string>('none');

  useEffect(() => {
    loadProcesses();
  }, [refreshTrigger]); // Recharger quand refreshTrigger change

  const loadProcesses = async () => {
    try {
      console.log('🔄 Chargement des processus depuis l\'API...');
      
      // Charger les processus depuis l'API avec authentification
      const data = await apiCall<Process[]>('/processes');
      console.log('✅ Processus chargés:', data);
      
      setProcesses(data);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur chargement processus:', error);
      
      // En cas d'erreur, utiliser des données de test
      const testProcesses: Process[] = [
        {
          id: '1',
          name: 'Développement Feature',
          description: 'Processus pour développer une nouvelle fonctionnalité',
          steps: JSON.stringify([
            {
              id: 'step1',
              title: 'Analyse des besoins',
              completed: false,
              isExpanded: true,
              subSteps: []
            },
            {
              id: 'step2',
              title: 'Design de l\'interface',
              completed: false,
              isExpanded: true,
              subSteps: []
            },
            {
              id: 'step3',
              title: 'Développement',
              completed: false,
              isExpanded: true,
              subSteps: [
                {
                  id: 'substep1',
                  title: 'Frontend',
                  completed: false,
                  isExpanded: true,
                  subSteps: []
                },
                {
                  id: 'substep2',
                  title: 'Backend',
                  completed: false,
                  isExpanded: true,
                  subSteps: []
                }
              ]
            },
            {
              id: 'step4',
              title: 'Tests',
              completed: false,
              isExpanded: true,
              subSteps: []
            },
            {
              id: 'step5',
              title: 'Déploiement',
              completed: false,
              isExpanded: true,
              subSteps: []
            }
          ])
        },
        {
          id: '2',
          name: 'Révision de Code',
          description: 'Processus de révision et amélioration du code',
          steps: JSON.stringify([
            {
              id: 'step1',
              title: 'Lecture du code',
              completed: false,
              isExpanded: true,
              subSteps: []
            },
            {
              id: 'step2',
              title: 'Identification des problèmes',
              completed: false,
              isExpanded: true,
              subSteps: []
            },
            {
              id: 'step3',
              title: 'Suggestions d\'amélioration',
              completed: false,
              isExpanded: true,
              subSteps: []
            },
            {
              id: 'step4',
              title: 'Tests des modifications',
              completed: false,
              isExpanded: true,
              subSteps: []
            }
          ])
        }
      ];
      
      setProcesses(testProcesses);
      setLoading(false);
    }
  };

  const handleSelect = (processId: string) => {
    setSelectedValue(processId);
    
    if (processId === 'none') {
      onSelect(null);
      return;
    }
    
    const selectedProcess = processes.find(p => p.id === processId);
    if (selectedProcess) {
      console.log('🔍 Processus sélectionné:', selectedProcess);
      
      // Vérifier si la description contient des étapes valides
      let steps = '[]';
      if (selectedProcess.description) {
        if (selectedProcess.description.trim().startsWith('[')) {
          // C'est du JSON, on peut l'utiliser
          steps = selectedProcess.description;
        } else {
          // C'est une description textuelle, on crée des étapes vides
          console.log('📝 Processus avec description textuelle, création d\'étapes vides');
          steps = '[]';
        }
      }
      
      // Adapter la structure pour correspondre à ce qui est attendu
      const adaptedProcess = {
        ...selectedProcess,
        steps: steps
      };
      
      console.log('🔄 Processus adapté:', adaptedProcess);
      onSelect(adaptedProcess);
    }
  };

  const processOptions = [
    { value: 'none', label: 'Aucun processus' },
    ...processes.map(process => ({
      value: process.id,
      label: process.name
    }))
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Utiliser un processus existant</Text>
      <Select
        options={processOptions}
        value={selectedValue}
        placeholder="Sélectionner un processus"
        onValueChange={handleSelect}
        style={styles.select}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  select: {
    backgroundColor: '#fff',
  },
});