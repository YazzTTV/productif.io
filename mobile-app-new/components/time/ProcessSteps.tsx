import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Checkbox } from '../ui/Checkbox';

interface Step {
  id: string;
  title: string;
  completed: boolean;
  isExpanded: boolean;
  subSteps: Step[];
}

interface ProcessStepsProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProcessSteps({ value, onChange }: ProcessStepsProps) {
  const [steps, setSteps] = useState<Step[]>(() => {
    try {
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Erreur parsing initial:', error);
      return [];
    }
  });

  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const editingInputRef = useRef<TextInput | null>(null);

  // Mettre à jour les steps quand value change
  useEffect(() => {
    if (editingStepId) return; // Ne pas mettre à jour si une édition est en cours
    
    console.log('📥 ProcessSteps - Nouvelle valeur reçue:', value);
    
    try {
      let parsed = [];
      
      if (value) {
        // Vérifier si c'est déjà un JSON valide
        if (typeof value === 'string') {
          // Si ça commence par '[' c'est probablement du JSON
          if (value.trim().startsWith('[')) {
            parsed = JSON.parse(value);
          } else {
            // Sinon c'est une description textuelle, on ignore
            console.log('📝 ProcessSteps - Description textuelle ignorée:', value);
            return; // Ne pas mettre à jour
          }
        } else {
          // Si c'est déjà un objet/array
          parsed = value;
        }
      }
      
      console.log('📋 ProcessSteps - Étapes parsées:', parsed);
      
      if (JSON.stringify(parsed) !== JSON.stringify(steps)) {
        console.log('🔄 ProcessSteps - Mise à jour des étapes');
        setSteps(parsed);
      }
    } catch (error) {
      console.error('❌ ProcessSteps - Erreur parsing:', error, 'Value:', value);
      // Ne pas mettre à jour en cas d'erreur pour éviter la boucle
      return;
    }
  }, [value, editingStepId]);

  // Générer un ID unique
  const generateId = () => `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Ajouter une étape
  const addStep = (parentId?: string) => {
    const newStep: Step = {
      id: generateId(),
      title: '',
      completed: false,
      isExpanded: true,
      subSteps: [],
    };

    const newSteps = [...steps];
    
    if (parentId) {
      // Ajouter comme sous-étape
      const addToParent = (stepsList: Step[]): boolean => {
        for (let i = 0; i < stepsList.length; i++) {
          if (stepsList[i].id === parentId) {
            stepsList[i].subSteps.push(newStep);
            stepsList[i].isExpanded = true;
            return true;
          }
          if (stepsList[i].subSteps.length > 0 && addToParent(stepsList[i].subSteps)) {
            return true;
          }
        }
        return false;
      };
      addToParent(newSteps);
    } else {
      // Ajouter comme étape principale
      newSteps.push(newStep);
    }

    setSteps(newSteps);
    setEditingStepId(newStep.id);
    onChange(JSON.stringify(newSteps));
  };

  // Supprimer une étape
  const deleteStep = (stepId: string) => {
    Alert.alert(
      'Supprimer l\'étape',
      'Êtes-vous sûr de vouloir supprimer cette étape ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            const removeStep = (stepsList: Step[]): Step[] => {
              return stepsList
                .filter(step => step.id !== stepId)
                .map(step => ({
                  ...step,
                  subSteps: removeStep(step.subSteps)
                }));
            };

            const newSteps = removeStep(steps);
            setSteps(newSteps);
            onChange(JSON.stringify(newSteps));
          }
        }
      ]
    );
  };

  // Mettre à jour une étape
  const updateStep = (stepId: string, updates: Partial<Step>) => {
    const updateInSteps = (stepsList: Step[]): Step[] => {
      return stepsList.map(step => {
        if (step.id === stepId) {
          return { ...step, ...updates };
        }
        return {
          ...step,
          subSteps: updateInSteps(step.subSteps)
        };
      });
    };

    const newSteps = updateInSteps(steps);
    setSteps(newSteps);
    onChange(JSON.stringify(newSteps));
  };

  // Basculer l'expansion d'une étape
  const toggleStep = (stepId: string) => {
    updateStep(stepId, { isExpanded: !getStepById(stepId)?.isExpanded });
  };

  // Obtenir une étape par ID
  const getStepById = (stepId: string): Step | null => {
    const findStep = (stepsList: Step[]): Step | null => {
      for (const step of stepsList) {
        if (step.id === stepId) return step;
        const found = findStep(step.subSteps);
        if (found) return found;
      }
      return null;
    };
    return findStep(steps);
  };

  // Sauvegarder l'édition
  const saveEdit = (stepId: string, newTitle: string) => {
    if (newTitle.trim()) {
      updateStep(stepId, { title: newTitle.trim() });
    } else {
      deleteStep(stepId);
    }
    setEditingStepId(null);
  };

  // Annuler l'édition
  const cancelEdit = (stepId: string) => {
    const step = getStepById(stepId);
    if (step && !step.title) {
      deleteStep(stepId);
    }
    setEditingStepId(null);
  };

  // Rendre une étape
  const renderStep = (step: Step, level: number = 0) => {
    const isEditing = editingStepId === step.id;
    const marginLeft = level * 20;

    return (
      <View key={step.id} style={[styles.stepContainer, { marginLeft }]}>
        <View style={styles.stepRow}>
          {/* Bouton d'expansion */}
          {step.subSteps.length > 0 ? (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleStep(step.id)}
            >
              <Ionicons
                name={step.isExpanded ? "chevron-down" : "chevron-forward"}
                size={16}
                color="#6b7280"
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.expandButton} />
          )}

          {/* Checkbox */}
          <Checkbox
            checked={step.completed}
            onCheckedChange={(checked) => updateStep(step.id, { completed: checked })}
            size={16}
            style={styles.checkbox}
          />

          {/* Titre ou input d'édition */}
          <View style={styles.titleContainer}>
            {isEditing ? (
              <TextInput
                ref={(ref) => {
                  if (ref && editingStepId === step.id) {
                    editingInputRef.current = ref;
                    setTimeout(() => ref.focus(), 100);
                  }
                }}
                style={styles.titleInput}
                value={step.title}
                onChangeText={(text) => updateStep(step.id, { title: text })}
                onBlur={() => saveEdit(step.id, step.title)}
                onSubmitEditing={() => saveEdit(step.id, step.title)}
                placeholder="Cliquez pour ajouter une étape..."
                placeholderTextColor="#9ca3af"
                returnKeyType="done"
              />
            ) : (
              <TouchableOpacity
                style={styles.titleButton}
                onPress={() => setEditingStepId(step.id)}
              >
                <Text style={[
                  styles.titleText,
                  step.completed && styles.completedText,
                  !step.title && styles.placeholderText
                ]}>
                  {step.title || 'Cliquez pour ajouter une étape...'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Actions */}
          {!isEditing && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => addStep(step.id)}
              >
                <Ionicons name="add" size={16} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => deleteStep(step.id)}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Sous-étapes */}
        {step.isExpanded && step.subSteps.map(subStep => 
          renderStep(subStep, level + 1)
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.scrollContent}
      >
        {steps.map(step => renderStep(step))}
        
        {/* Bouton ajouter étape principale */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => addStep()}
        >
          <Ionicons name="add" size={20} color="#10b981" />
          <Text style={styles.addButtonText}>Ajouter une étape</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50, // Espace supplémentaire en bas
  },
  stepContainer: {
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
  },
  expandButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  checkbox: {
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleInput: {
    fontSize: 14,
    color: '#111827',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 4,
    backgroundColor: '#f9fafb',
  },
  titleButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  titleText: {
    fontSize: 14,
    color: '#111827',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  placeholderText: {
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 4,
    marginLeft: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    borderRadius: 8,
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 14,
    color: '#10b981',
    marginLeft: 8,
    fontWeight: '500',
  },
});