import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOnboardingData } from '@/hooks/useOnboardingData';

interface ClarifiedTask {
  id: string;
  title: string;
  category?: string;
  priority: boolean;
  dueDate?: string;
}

export default function TaskClarificationScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { saveResponse } = useOnboardingData();
  const [tasks, setTasks] = useState<ClarifiedTask[]>([]);

  useEffect(() => {
    try {
      const tasksParam = params.tasks as string;
      if (tasksParam) {
        const parsedTasks = JSON.parse(tasksParam);
        // Transformer les tâches de l'API en format ClarifiedTask
        const clarifiedTasks: ClarifiedTask[] = parsedTasks.map((task: any, index: number) => ({
          id: task.id || `task-${index}`,
          title: task.title || task.name || '',
          category: task.category || 'General',
          priority: task.priority === 4 || task.priority === 'high' || false,
          dueDate: task.dueDate,
        }));
        setTasks(clarifiedTasks);
      }
    } catch (error) {
      console.error('Erreur lors du parsing des tâches:', error);
    }
  }, [params.tasks]);

  const togglePriority = (id: string) => {
    setTasks(prev =>
      prev.map(task => (task.id === id ? { ...task, priority: !task.priority } : task))
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const updateTaskTitle = (id: string, title: string) => {
    setTasks(prev =>
      prev.map(task => (task.id === id ? { ...task, title } : task))
    );
  };

  const handleContinue = async () => {
    if (tasks.length === 0) return;
    
    // Sauvegarder les tâches clarifiées
    await saveResponse('clarifiedTasks', tasks);
    await saveResponse('currentStep', 10);
    
    // Passer les tâches à l'écran de construction du plan
    router.push({
      pathname: '/(onboarding-new)/building-plan',
      params: {
        tasks: JSON.stringify(tasks),
      },
    });
  };

  // Grouper les tâches par catégorie
  const groupedTasks = tasks.reduce((acc, task) => {
    const category = task.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(task);
    return acc;
  }, {} as Record<string, ClarifiedTask[]>);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Title */}
          <Animated.View entering={FadeIn.delay(100).duration(400)}>
            <Text style={styles.title}>
              {t('whatWeUnderstood') || "Here's what we understood."}
            </Text>
          </Animated.View>

          {/* Grouped tasks */}
          {Object.keys(groupedTasks).length > 0 ? (
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.tasksContainer}>
              {Object.entries(groupedTasks).map(([category, categoryTasks], categoryIndex) => (
                <View key={category} style={styles.categorySection}>
                  <Text style={styles.categoryLabel}>{category}</Text>
                  <View style={styles.tasksList}>
                    {categoryTasks.map((task, taskIndex) => (
                      <Animated.View
                        key={task.id}
                        entering={FadeInDown.delay(300 + categoryIndex * 100 + taskIndex * 50).duration(400)}
                        style={[
                          styles.taskCard,
                          task.priority && styles.taskCardPriority,
                        ]}
                      >
                        <View style={styles.taskContent}>
                          {/* Priority checkbox */}
                          <TouchableOpacity
                            onPress={() => togglePriority(task.id)}
                            style={[
                              styles.priorityButton,
                              task.priority && styles.priorityButtonSelected,
                            ]}
                            activeOpacity={0.7}
                          >
                            {task.priority && (
                              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                            )}
                          </TouchableOpacity>

                          {/* Task title */}
                          <TextInput
                            style={styles.taskTitle}
                            value={task.title}
                            onChangeText={(text) => updateTaskTitle(task.id, text)}
                            placeholder="Task title"
                            placeholderTextColor="rgba(0, 0, 0, 0.4)"
                          />

                          {/* Delete button */}
                          <TouchableOpacity
                            onPress={() => deleteTask(task.id)}
                            style={styles.deleteButton}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={18} color="rgba(0, 0, 0, 0.4)" />
                          </TouchableOpacity>
                        </View>

                        {task.priority && (
                          <Text style={styles.priorityLabel}>
                            {t('mustDoTomorrow') || 'Must do tomorrow'}
                          </Text>
                        )}
                      </Animated.View>
                    ))}
                  </View>
                </View>
              ))}
            </Animated.View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tasks extracted yet...</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed bottom CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleContinue}
          disabled={tasks.length === 0}
          style={[
            styles.continueButton,
            tasks.length === 0 && styles.continueButtonDisabled,
          ]}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>
            {t('buildIdealDay') || 'Build my ideal day'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -0.03 * 24,
  },
  tasksContainer: {
    gap: 24,
  },
  categorySection: {
    gap: 12,
  },
  categoryLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    paddingLeft: 4,
    marginBottom: 8,
  },
  tasksList: {
    gap: 8,
  },
  taskCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  taskCardPriority: {
    borderColor: 'rgba(22, 163, 74, 0.3)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    padding: 0,
  },
  deleteButton: {
    padding: 4,
  },
  priorityLabel: {
    fontSize: 12,
    color: '#16A34A',
    marginTop: 8,
    paddingLeft: 36,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  continueButton: {
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.4,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

