import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Habit {
  id: string;
  name: string;
  description?: string;
}

interface HabitNoteModalProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: string, rating?: number) => Promise<void>;
  initialNote?: string;
  initialRating?: number;
}

export function HabitNoteModal({
  habit,
  isOpen,
  onClose,
  onSave,
  initialNote = "",
  initialRating
}: HabitNoteModalProps) {
  const [note, setNote] = useState(initialNote);
  const [rating, setRating] = useState(initialRating || 5);
  const [isLoading, setIsLoading] = useState(false);

  // Mettre à jour les valeurs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setNote(initialNote);
      setRating(initialRating || 5);
    }
  }, [isOpen, initialNote, initialRating]);

  // Identifier le type d'habitude
  const isLearningHabit = habit.name.toLowerCase().includes('apprentissage');
  const isDayNoteHabit = habit.name.toLowerCase().includes('note de sa journée') || 
                        habit.name.toLowerCase().includes('note de la journée') ||
                        (habit.name.toLowerCase().includes('note') && habit.name.toLowerCase().includes('journée'));

  const handleSave = async () => {
    if (isLearningHabit && !note.trim()) {
      Alert.alert('Erreur', 'Veuillez décrire ce que vous avez appris.');
      return;
    }

    setIsLoading(true);
    try {
      if (isLearningHabit) {
        // Pour l'apprentissage : seulement la note est importante
        await onSave(note);
      } else if (isDayNoteHabit) {
        // Pour "Note de sa journée" : rating obligatoire, note optionnelle
        await onSave(note, rating);
      } else {
        // Pour les autres habitudes avec notes
        await onSave(note);
      }
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setNote(initialNote);
    setRating(initialRating || 5);
    onClose();
  };

  const getTitle = () => {
    if (isLearningHabit) return 'Apprentissage';
    if (isDayNoteHabit) return 'Note de sa journée';
    return habit.name;
  };

  const getDescription = () => {
    if (isLearningHabit) return "Notez ce que vous avez appris aujourd'hui";
    if (isDayNoteHabit) return "Évaluez votre journée sur 10 et expliquez pourquoi";
    return "Ajoutez une note pour cette habitude";
  };

  const getPlaceholder = () => {
    if (isLearningHabit) return "Décrivez ce que vous avez appris, les concepts clés, vos réflexions...";
    if (isDayNoteHabit) return "Expliquez comment s'est passée votre journée...";
    return "Ajoutez une note sur cette session...";
  };

  const getInputLabel = () => {
    if (isLearningHabit) return "Qu'avez-vous appris ?";
    if (isDayNoteHabit) return "Comment s'est passée votre journée ?";
    return "Note (optionnel)";
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.iconContainer}>
              <Text style={styles.headerIcon}>
                {isLearningHabit ? '✏️' : isDayNoteHabit ? '📝' : '📋'}
              </Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{getTitle()}</Text>
              <Text style={styles.description}>{getDescription()}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            disabled={isLoading}
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Note/Apprentissage */}
          <View style={styles.section}>
            <Text style={styles.label}>{getInputLabel()}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={getPlaceholder()}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!isLoading}
            />
          </View>

          {/* Rating pour "Note de sa journée" */}
          {isDayNoteHabit && (
            <View style={styles.section}>
              <Text style={styles.label}>Note sur 10</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.ratingButton,
                      rating === value && styles.ratingButtonActive
                    ]}
                    onPress={() => setRating(value)}
                    disabled={isLoading}
                  >
                    <Text style={[
                      styles.ratingText,
                      rating === value && styles.ratingTextActive
                    ]}>
                      {value}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={handleClose}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.saveButton,
              isLoading && styles.saveButtonDisabled
            ]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 120,
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingButton: {
    width: (width - 80) / 5 - 8,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  ratingTextActive: {
    color: 'white',
  },
  footer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#10B981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});