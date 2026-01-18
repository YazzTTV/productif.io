import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboardingData } from '@/hooks/useOnboardingData';
import DateTimePicker from '@react-native-community/datetimepicker';

interface TimelineBlock {
  time: string;
  duration: number;
  activity: string;
  priority: boolean;
}

export default function IdealDayScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { saveResponse } = useOnboardingData();
  const [priorities, setPriorities] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<TimelineBlock[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());

  useEffect(() => {
    try {
      const tasksParam = params.tasks as string;
      if (tasksParam) {
        const tasks = JSON.parse(tasksParam);
        
        // Extraire les 3 tâches prioritaires
        const priorityTasks = tasks
          .filter((task: any) => task.priority)
          .slice(0, 3)
          .map((task: any) => task.title);
        setPriorities(priorityTasks);

        // Créer la timeline à partir des tâches
        const blocks: TimelineBlock[] = tasks
          .filter((task: any) => task.dueDate)
          .map((task: any) => {
            const dueDate = new Date(task.dueDate);
            const hours = dueDate.getHours();
            const minutes = dueDate.getMinutes();
            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            // Estimer la durée en fonction de la priorité et de l'énergie
            let duration = 60; // Par défaut 60 minutes
            if (task.energyLevel === 0) duration = 30;
            else if (task.energyLevel === 1) duration = 45;
            else if (task.energyLevel === 2) duration = 60;
            else if (task.energyLevel === 3) duration = 90;

            return {
              time: timeStr,
              duration,
              activity: task.title,
              priority: task.priority === 4 || task.priority === 'high',
            };
          })
          .sort((a: TimelineBlock, b: TimelineBlock) => {
            const [aHours, aMinutes] = a.time.split(':').map(Number);
            const [bHours, bMinutes] = b.time.split(':').map(Number);
            return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
          });

        // Ajouter des pauses entre les blocs de travail
        const blocksWithBreaks: TimelineBlock[] = [];
        for (let i = 0; i < blocks.length; i++) {
          blocksWithBreaks.push(blocks[i]);
          
          // Ajouter une pause de 15 minutes après chaque bloc de travail de 90+ minutes
          if (blocks[i].duration >= 90 && i < blocks.length - 1) {
            const [hours, minutes] = blocks[i].time.split(':').map(Number);
            const endTime = hours * 60 + minutes + blocks[i].duration;
            const breakHours = Math.floor(endTime / 60);
            const breakMinutes = endTime % 60;
            const breakTimeStr = `${breakHours.toString().padStart(2, '0')}:${breakMinutes.toString().padStart(2, '0')}`;
            
            blocksWithBreaks.push({
              time: breakTimeStr,
              duration: 15,
              activity: t('breakLabel'),
              priority: false,
            });
          }
        }
        
        setTimeline(blocksWithBreaks);
        
        // Sauvegarder la journée idéale
        saveResponse('idealDay', {
          priorities: priorityTasks,
          timeline: blocksWithBreaks,
        });
        saveResponse('currentStep', 11);
      }
    } catch (error) {
      console.error('Erreur lors du parsing des tâches:', error);
    }
  }, [params.tasks]);

  const handleSyncCalendar = async () => {
    // Récupérer le firstName depuis AsyncStorage pour le passer à calendar-sync
    const storedFirstName = await AsyncStorage.getItem('onboarding_firstName');
    
    // Récupérer les tâches depuis les paramètres pour les passer à calendar-sync
    const tasksParam = params.tasks as string;
    
    router.push({
      pathname: '/(onboarding-new)/calendar-sync',
      params: {
        ...(storedFirstName ? { firstName: storedFirstName } : {}),
        ...(tasksParam ? { tasks: tasksParam } : {}),
      },
    });
  };

  const handleStartFocus = () => {
    router.replace('/(tabs)');
  };

  const handleAdjust = () => {
    setIsEditing(true);
  };

  const handleTimeEdit = (index: number) => {
    const block = timeline[index];
    const [hours, minutes] = block.time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    setSelectedTime(date);
    setEditingIndex(index);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date && editingIndex !== null) {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      const updatedTimeline = [...timeline];
      updatedTimeline[editingIndex] = {
        ...updatedTimeline[editingIndex],
        time: timeStr,
      };
      
      // Trier la timeline par heure
      updatedTimeline.sort((a, b) => {
        const [aHours, aMinutes] = a.time.split(':').map(Number);
        const [bHours, bMinutes] = b.time.split(':').map(Number);
        return aHours * 60 + aMinutes - (bHours * 60 + bMinutes);
      });
      
      setTimeline(updatedTimeline);
      setEditingIndex(null);
    }
  };

  const handleSaveAdjustments = () => {
    setIsEditing(false);
  };

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
              {t('idealDayTitle') || "Here's your ideal day for tomorrow."}
            </Text>
          </Animated.View>

          {/* Top priorities card */}
          {priorities.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(200).duration(400)}
              style={styles.prioritiesCard}
            >
              <Text style={styles.prioritiesTitle}>
                {t('topPriorities') || 'Your 3 priorities'}
              </Text>
              <View style={styles.prioritiesList}>
                {priorities.map((priority, index) => (
                  <Animated.View
                    key={index}
                    entering={FadeInDown.delay(300 + index * 100).duration(400)}
                    style={styles.priorityItem}
                  >
                    <View style={styles.priorityNumber}>
                      <Text style={styles.priorityNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.priorityText}>{priority}</Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Timeline */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.timelineContainer}>
            {timeline.map((block, index) => {
              if (block.duration === 0) return null;

              return (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(500 + index * 30).duration(400)}
                  style={[
                    styles.timelineBlock,
                    block.priority && styles.timelineBlockPriority,
                    isEditing && styles.timelineBlockEditing,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.timelineTime}
                    onPress={isEditing ? () => handleTimeEdit(index) : undefined}
                    disabled={!isEditing}
                    activeOpacity={isEditing ? 0.7 : 1}
                  >
                    <Text style={[
                      styles.timelineTimeText,
                      isEditing && styles.timelineTimeTextEditable,
                    ]}>
                      {block.time}
                    </Text>
                    <Text style={styles.timelineDurationText}>{block.duration}min</Text>
                    {isEditing && (
                      <Ionicons name="chevron-down" size={12} color="rgba(0, 0, 0, 0.4)" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.timelineContent}>
                    <Text style={[
                      styles.timelineActivity,
                      block.priority && styles.timelineActivityPriority,
                    ]}>
                      {block.activity}
                    </Text>
                  </View>

                  {block.priority && (
                    <View style={styles.priorityDot} />
                  )}
                </Animated.View>
              );
            })}
          </Animated.View>

          <Animated.View entering={FadeIn.delay(800).duration(400)}>
            <Text style={styles.footerText}>
              {t('enoughForGoodDay') || 'This is enough to make tomorrow a good day.'}
            </Text>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Fixed bottom CTAs */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleSyncCalendar}
          style={styles.syncButton}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
          <Text style={styles.syncButtonText}>
            {t('syncCalendar') || 'Sync to Google Calendar'}
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryButtons}>
          <TouchableOpacity
            onPress={handleStartFocus}
            style={styles.startFocusButton}
            activeOpacity={0.8}
          >
            <Ionicons name="play" size={18} color="#000000" style={styles.playIcon} />
            <Text style={styles.startFocusButtonText}>
              {t('startFocusNow') || 'Start Focus now'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={isEditing ? handleSaveAdjustments : handleAdjust}
            style={[styles.adjustButton, isEditing && styles.adjustButtonActive]}
            activeOpacity={0.8}
          >
            <Ionicons 
              name={isEditing ? "checkmark" : "create-outline"} 
              size={16} 
              color={isEditing ? "#FFFFFF" : "rgba(0, 0, 0, 0.6)"} 
            />
            <Text style={[styles.adjustButtonText, isEditing && styles.adjustButtonTextActive]}>
              {isEditing ? (t('save') || 'Save') : (t('adjust') || 'Adjust')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Picker Modal */}
      {showTimePicker && (
        <Modal
          visible={showTimePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTimePicker(false)}
        >
          <View style={styles.timePickerOverlay}>
            <View style={styles.timePickerContainer}>
              <View style={styles.timePickerHeader}>
                <Text style={styles.timePickerTitle}>
                  {t('selectTime') || 'Select time'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowTimePicker(false);
                    setEditingIndex(null);
                  }}
                  style={styles.timePickerCloseButton}
                >
                  <Ionicons name="close" size={24} color="#000000" />
                </TouchableOpacity>
              </View>
              
              <DateTimePicker
                value={selectedTime}
                mode="time"
                is24Hour={true}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleTimeChange}
                style={styles.timePicker}
              />

              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  onPress={() => {
                    handleTimeChange(null, selectedTime);
                    setShowTimePicker(false);
                  }}
                  style={styles.timePickerConfirmButton}
                >
                  <Text style={styles.timePickerConfirmText}>
                    {t('confirm') || 'Confirm'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      )}
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
    paddingBottom: 200,
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
  prioritiesCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    marginBottom: 32,
  },
  prioritiesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
    letterSpacing: -0.02 * 18,
  },
  prioritiesList: {
    gap: 12,
  },
  priorityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priorityNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  priorityText: {
    flex: 1,
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.8)',
  },
  timelineContainer: {
    gap: 8,
    marginBottom: 32,
  },
  timelineBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  timelineBlockPriority: {
    borderColor: 'rgba(22, 163, 74, 0.3)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  timelineTime: {
    width: 64,
    alignItems: 'center',
    gap: 4,
  },
  timelineTimeText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  timelineDurationText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  timelineContent: {
    flex: 1,
  },
  timelineActivity: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  timelineActivityPriority: {
    color: '#000000',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  footerText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
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
    gap: 12,
  },
  syncButton: {
    backgroundColor: '#16A34A',
    height: 56,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  syncButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  startFocusButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  playIcon: {
    marginLeft: -2, // Légèrement décalé pour mieux centrer visuellement
  },
  startFocusButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  adjustButton: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adjustButtonText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  adjustButtonActive: {
    backgroundColor: '#16A34A',
    borderWidth: 0,
  },
  adjustButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timelineBlockEditing: {
    borderColor: 'rgba(22, 163, 74, 0.3)',
  },
  timelineTimeTextEditable: {
    color: '#16A34A',
    fontWeight: '600',
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '90%',
    maxWidth: 400,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.02 * 20,
  },
  timePickerCloseButton: {
    padding: 4,
  },
  timePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : undefined,
  },
  timePickerConfirmButton: {
    marginTop: 20,
    backgroundColor: '#16A34A',
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
