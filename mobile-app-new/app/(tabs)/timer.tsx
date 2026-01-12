import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { PomodoroTimer } from '../../components/time/PomodoroTimer';
import { ProcessSteps } from '../../components/time/ProcessSteps';
import { ProcessSelector } from '../../components/time/ProcessSelector';
import { apiCall } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed?: boolean;
  project?: {
    id: string;
    name: string;
    color: string;
  };
}

interface Process {
  id: string;
  name: string;
  description: string;
  steps: string;
}

export default function TimerScreen() {
  const { taskId, taskTitle } = useLocalSearchParams<{ taskId?: string; taskTitle?: string }>();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [task, setTask] = useState<Task | null>(null);
  const [process, setProcess] = useState("");
  const [showSaveProcessDialog, setShowSaveProcessDialog] = useState(false);
  const [processName, setProcessName] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [refreshProcesses, setRefreshProcesses] = useState(0);

  // Charger les détails de la tâche
  useEffect(() => {
    if (taskId) {
      // TODO: Charger les détails de la tâche depuis l'API
      setTask({
        id: taskId,
        title: taskTitle || t('untitledTask'),
        completed: false,
      });
      setIsCompleted(false);
    }
  }, [taskId, taskTitle]);

  // Enregistrer l'heure de début
  useEffect(() => {
    setStartTime(new Date());
  }, []);

  // Gestionnaire de sélection de processus
  const handleProcessSelect = (selectedProcess: Process | null) => {
    console.log('🎯 handleProcessSelect appelé avec:', selectedProcess);
    
    if (selectedProcess) {
      let steps = selectedProcess.steps || selectedProcess.description || '';
      
      // Validation supplémentaire : si ce n'est pas du JSON valide, on utilise des étapes vides
      if (steps && typeof steps === 'string' && !steps.trim().startsWith('[')) {
        console.log('⚠️ Description textuelle détectée, utilisation d\'étapes vides');
        steps = '';
      }
      
      console.log('📋 Étapes extraites:', steps);
      setProcess(steps);
    } else {
      console.log('🚫 Aucun processus sélectionné');
      setProcess("");
    }
  };

  // Gestionnaire de completion du timer
  const handleTimerComplete = () => {
    Alert.alert(
      t('sessionCompleted'),
      t('markTaskCompleted'),
      [
        { text: t('no'), style: 'cancel' },
        {
          text: t('yes'),
          onPress: async () => {
            try {
              // TODO: Marquer la tâche comme terminée via l'API
              console.log('✅ Marquer tâche terminée:', taskId);
              setIsCompleted(true);
              Alert.alert(t('success'), t('taskMarkedCompleted'));
            } catch (error) {
              console.error('Erreur:', error);
              Alert.alert(t('error'), t('taskMarkCompletedError'));
            }
          }
        }
      ]
    );
  };

  // Sauvegarder le processus
  const handleSaveProcess = async () => {
    if (!processName.trim()) {
      Alert.alert(t('error'), t('enterProcessName'));
      return;
    }

    if (!process.trim()) {
      Alert.alert(t('error'), t('createProcessStep'));
      return;
    }

    try {
      console.log('💾 Sauvegarder processus:', {
        name: processName,
        steps: process,
        saveAsTemplate,
      });

      // Sauvegarder le processus via l'API
      const savedProcess = await apiCall('/processes', {
        method: 'POST',
        body: JSON.stringify({
          name: processName.trim(),
          description: process, // Les étapes sont stockées dans description
        }),
      });

      console.log('✅ Processus sauvegardé:', savedProcess);
      Alert.alert(t('success'), t('processSavedSuccess'));
      setShowSaveProcessDialog(false);
      setProcessName("");
      setSaveAsTemplate(false);
      
      // Déclencher le rechargement de la liste des processus
      setRefreshProcesses(prev => prev + 1);
    } catch (error) {
      console.error('❌ Erreur sauvegarde processus:', error);
      Alert.alert(t('error'), t('processSaveError'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Timer</Text>
        <TouchableOpacity
          style={styles.soundButton}
          onPress={() => Alert.alert(t('sound'), t('soundSettings'))}
        >
          <Ionicons name="volume-high" size={20} color="#10b981" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tâche terminée */}
        {isCompleted && (
          <View style={styles.completedBanner}>
            <View style={styles.completedContent}>
              <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              <View style={styles.completedText}>
                <Text style={styles.completedTitle}>Tâche terminée !</Text>
                <Text style={styles.completedDescription}>
                  Excellente session de travail. Continuez sur cette lancée !
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Timer Pomodoro */}
        <View style={styles.timerSection}>
          <PomodoroTimer
            onComplete={handleTimerComplete}
            taskTitle={task?.title}
          />
        </View>

        {/* Section Processus */}
        <View style={styles.processSection}>
          <View style={styles.processHeader}>
            <Text style={styles.processTitle}>Processus</Text>
            <TouchableOpacity
              style={styles.saveProcessButton}
              onPress={() => setShowSaveProcessDialog(true)}
            >
              <Ionicons name="save-outline" size={16} color="#10b981" />
              <Text style={styles.saveProcessButtonText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.processContent}>
                            <ProcessSelector 
                  onSelect={handleProcessSelect} 
                  refreshTrigger={refreshProcesses}
                />
            <View style={styles.processStepsContainer}>
              <ProcessSteps
                value={process}
                onChange={setProcess}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal de sauvegarde de processus */}
      <Modal
        visible={showSaveProcessDialog}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.saveModal}>
          <View style={styles.saveModalHeader}>
            <TouchableOpacity
              onPress={() => setShowSaveProcessDialog(false)}
            >
              <Text style={styles.cancelButton}>Annuler</Text>
            </TouchableOpacity>
            <Text style={styles.saveModalTitle}>Sauvegarder le processus</Text>
            <TouchableOpacity onPress={handleSaveProcess}>
              <Text style={styles.saveButton}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.saveModalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom du processus</Text>
              <TextInput
                style={styles.textInput}
                value={processName}
                onChangeText={setProcessName}
                placeholder="Ex: Développement Feature"
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.inputLabel}>Sauvegarder comme modèle</Text>
              <Text style={styles.inputDescription}>
                Permettra de réutiliser ce processus pour d'autres tâches
              </Text>
              <Switch
                value={saveAsTemplate}
                onValueChange={setSaveAsTemplate}
                trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                thumbColor={saveAsTemplate ? '#fff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  soundButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Espace supplémentaire en bas
  },
  completedBanner: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  completedContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    flex: 1,
    marginLeft: 12,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
    marginBottom: 4,
  },
  completedDescription: {
    fontSize: 14,
    color: '#047857',
  },
  timerSection: {
    marginBottom: 24,
  },
  processSection: {
    flex: 1,
    minHeight: 400, // Hauteur minimum pour la section processus
  },
  processHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  processTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  saveProcessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 8,
  },
  saveProcessButtonText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
    marginLeft: 4,
  },
  processContent: {
    gap: 16,
  },
  processStepsContainer: {
    flex: 1,
    minHeight: 300, // Hauteur minimum pour les étapes
  },
  saveModal: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  saveModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  saveModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  saveButton: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '600',
  },
  saveModalContent: {
    padding: 16,
    gap: 20,
  },
  inputGroup: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  inputDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  textInput: {
    fontSize: 16,
    color: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  switchGroup: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
});