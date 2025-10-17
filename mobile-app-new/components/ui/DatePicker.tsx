import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DatePickerProps {
  value?: Date;
  onValueChange: (date: Date | undefined) => void;
  placeholder: string;
  style?: any;
}

export function DatePicker({ value, onValueChange, placeholder, style }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setIsOpen(false);
      if (event.type === 'set' && selectedDate) {
        onValueChange(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleIOSConfirm = () => {
    onValueChange(tempDate);
    setIsOpen(false);
  };

  const handleIOSCancel = () => {
    setTempDate(value || new Date());
    setIsOpen(false);
  };

  const handleClear = () => {
    onValueChange(undefined);
    setIsOpen(false);
  };

  return (
    <View style={style}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[
          styles.triggerText,
          !value && styles.placeholderText
        ]}>
          {value ? format(value, 'dd MMMM yyyy', { locale: fr }) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#6b7280" />
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={isOpen}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsOpen(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.iosContainer}>
              <View style={styles.iosHeader}>
                <TouchableOpacity onPress={handleIOSCancel}>
                  <Text style={styles.iosButton}>Annuler</Text>
                </TouchableOpacity>
                <Text style={styles.iosTitle}>Choisir une date</Text>
                <TouchableOpacity onPress={handleIOSConfirm}>
                  <Text style={[styles.iosButton, styles.iosConfirmButton]}>Confirmer</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ padding: 20, textAlign: 'center' }}>
                Sélecteur de date temporairement désactivé
              </Text>
              {value && (
                <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                  <Text style={styles.clearButtonText}>Supprimer la date</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Modal>
      ) : (
        isOpen && (
          <Text>Sélecteur Android temporairement désactivé</Text>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    minHeight: 48,
  },
  triggerText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  iosContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area
  },
  iosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  iosTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  iosButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  iosConfirmButton: {
    color: '#22c55e',
    fontWeight: '600',
  },
  clearButton: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#ef4444',
  },
});