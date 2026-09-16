import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { behaviorService, habitsService } from '@/lib/api';
import { dashboardEvents, DASHBOARD_DATA_CHANGED } from '@/lib/events';
import { StatusBar } from 'expo-status-bar';

type Kind = 'mood' | 'stress' | 'focus' | 'day';

export default function CheckInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind: Kind = ['mood', 'stress', 'focus', 'day'].includes(params.kind || '') ? params.kind as Kind : 'mood';
  const isDay = kind === 'day';
  const [value, setValue] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [habitId, setHabitId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [loadingHabit, setLoadingHabit] = useState(isDay);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!isDay) return;
    let active = true;
    setLoadingHabit(true);
    habitsService.getAll().then((result) => {
      const habits = Array.isArray(result) ? result : result?.habits || result?.data || [];
      const habit = habits.find((item: any) => {
        const name = String(item?.name || '').toLowerCase();
        return name.includes('note de sa journée') || name.includes('note de la journée') || (name.includes('note') && name.includes('journée'));
      });
      if (active) setHabitId(habit?.id || null);
    }).catch(() => { if (active) setHabitId(null); }).finally(() => { if (active) setLoadingHabit(false); });
    return () => { active = false; };
  }, [isDay, retry]);

  const { language } = useLanguage();
  const tr = (fr: string, en: string, es: string) => language === 'en' ? en : language === 'es' ? es : fr;
  const metric = language === 'en' ? (kind === 'stress' ? 'stress' : kind === 'focus' ? 'focus' : 'mood') : language === 'es' ? (kind === 'stress' ? 'estrés' : kind === 'focus' ? 'concentración' : 'ánimo') : (kind === 'stress' ? 'stress' : kind === 'focus' ? 'concentration' : 'humeur');
  const copy = {
    fr: { title: isDay ? 'Noter ta journée' : `Check-in ${metric}`, subtitle: isDay ? 'Comment s’est passée ta journée ?' : `Quel est ton niveau de ${metric} maintenant ?`, button: isDay ? 'Enregistrer ma journée' : kind === 'focus' ? 'Enregistrer ma concentration' : `Enregistrer mon ${metric}` },
    en: { title: isDay ? 'Rate your day' : `${metric[0].toUpperCase()}${metric.slice(1)} check-in`, subtitle: isDay ? 'How did your day go?' : `What is your ${metric} level right now?`, button: isDay ? 'Save my day' : `Save my ${metric}` },
    es: { title: isDay ? 'Valora tu día' : `Check-in de ${metric}`, subtitle: isDay ? '¿Cómo fue tu día?' : `¿Cuál es tu nivel de ${metric} ahora?`, button: isDay ? 'Guardar mi día' : `Guardar mi ${metric}` },
  };
  const text = copy[language === 'en' ? 'en' : language === 'es' ? 'es' : 'fr'];


  const close = () => { if (router.canGoBack?.()) router.back(); else router.replace('/(tabs)'); };

  async function save() {
    if (value === null || busy || saved || (isDay && !habitId)) return;
    setBusy(true); setError('');
    try {
      if (isDay) {
        if (!habitId) throw new Error('Habitude de journée indisponible');
        const date = new Date();
        const pad = (n: number) => String(n).padStart(2, '0');
        const today = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        await habitsService.saveWithNote(habitId, today, note.trim(), value);
      } else {
        await behaviorService.createCheckIn({ type: kind as 'mood' | 'stress' | 'focus', value, note: note.trim() || undefined, context: { source: 'mobile_check_in' } });
      }
      setSaved(true);
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
    } catch {
      setError(tr('Impossible d’enregistrer pour le moment. Réessaie.', 'Could not save. Please try again.', 'No se pudo guardar. Inténtalo de nuevo.'));
    } finally { setBusy(false); }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { paddingTop: insets.top }]}><StatusBar style="dark" />
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={tr("Retour", "Back", "Volver")} onPress={close} style={styles.back}><Ionicons name="arrow-back" size={23} color="#111827" /></TouchableOpacity>
      <Text style={styles.headerTitle}>{text.title}</Text><View style={styles.spacer} />
    </View>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
      {saved ? <View style={styles.success}>
        <View style={styles.successIcon}><Ionicons name="checkmark" size={28} color="#166534" /></View>
        <Text style={styles.successTitle}>{tr("C’est enregistré.", "Saved.", "Guardado.")}</Text>
        <Text style={styles.successText}>{isDay ? tr('Ta note de journée est enregistrée.', 'Your day rating is saved.', 'La valoración de tu día está guardada.') : tr('Ton ressenti est ajouté à tes analyses.', 'Your check-in is added to your analysis.', 'Tu valoración se añade a tus análisis.')}</Text>
        <TouchableOpacity style={styles.primary} onPress={close}><Text style={styles.primaryText}>{tr("Retour", "Back", "Volver")}</Text></TouchableOpacity>
      </View> : <>
        <Text style={styles.title}>{text.subtitle}</Text>
        <Text style={styles.helper}>{tr("Choisis une note de 1 (faible) à 10 (élevé).", "Choose a rating from 1 (low) to 10 (high).", "Elige una nota de 1 (bajo) a 10 (alto).")}</Text>
        <View style={styles.values}>{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <TouchableOpacity key={n} accessibilityRole="button" accessibilityLabel={`${n} sur 10`} accessibilityState={{ selected: value === n }} onPress={() => setValue(n)} style={[styles.value, value === n && styles.valueSelected]}><Text style={[styles.valueText, value === n && styles.valueTextSelected]}>{n}</Text></TouchableOpacity>)}</View>
        <Text style={styles.label}>{tr("Quelques mots (facultatif)", "A few words (optional)", "Unas palabras (opcional)")}</Text>
        <TextInput value={note} onChangeText={setNote} multiline maxLength={2000} placeholder={tr('Ce que tu souhaites retenir…', 'What you want to remember…', 'Lo que quieres recordar…')} placeholderTextColor="#9CA3AF" style={styles.input} />
        {isDay && loadingHabit && <ActivityIndicator color="#166534" />}
        {isDay && !loadingHabit && !habitId && <View>
          <Text style={styles.helper}>{tr('La note de journée nécessite l’habitude « Note de sa journée ». Vérifie tes habitudes ou réessaie le chargement.', 'Day ratings need the “Note de sa journée” habit. Check your habits or retry loading.', 'La valoración del día requiere el hábito “Note de sa journée”. Revisa tus hábitos o reintenta la carga.')}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => setRetry(n => n + 1)}><Text style={styles.label}>{tr('Réessayer', 'Retry', 'Reintentar')}</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/habits-manager')}><Text style={styles.label}>{tr('Mes habitudes', 'My habits', 'Mis hábitos')}</Text></TouchableOpacity>
        </View>}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity accessibilityRole="button" disabled={value === null || busy || (isDay && !habitId)} onPress={save} style={[styles.primary, (value === null || (isDay && !habitId)) && styles.disabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{text.button}</Text>}</TouchableOpacity>
      </>}
    </ScrollView>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#F9FAFB' }, header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }, back: { padding: 7 }, spacer: { width: 38 }, headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#111827' }, content: { padding: 24, paddingBottom: 48 }, title: { fontSize: 27, lineHeight: 34, fontWeight: '700', color: '#111827', marginTop: 18 }, helper: { fontSize: 15, color: '#6B7280', marginTop: 8, marginBottom: 24 }, values: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 }, value: { width: 49, height: 49, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB' }, valueSelected: { backgroundColor: '#166534', borderColor: '#166534' }, valueText: { fontSize: 17, color: '#374151', fontWeight: '600' }, valueTextSelected: { color: '#fff' }, label: { color: '#374151', fontWeight: '600', marginBottom: 9 }, input: { minHeight: 110, borderRadius: 15, padding: 15, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', textAlignVertical: 'top', fontSize: 16, color: '#111827' }, primary: { minHeight: 52, borderRadius: 15, marginTop: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#166534', paddingHorizontal: 20 }, primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' }, disabled: { opacity: 0.45 }, error: { color: '#B91C1C', marginTop: 12 }, success: { alignItems: 'center', paddingTop: 80 }, successIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' }, successTitle: { fontSize: 25, fontWeight: '700', color: '#111827', marginTop: 18 }, successText: { textAlign: 'center', color: '#6B7280', fontSize: 16, lineHeight: 24, marginTop: 8 } });
