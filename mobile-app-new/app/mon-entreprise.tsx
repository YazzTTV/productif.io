import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { apiCall } from '@/lib/api'
import { Select } from '@/components/ui/Select'
import { DatePicker } from '@/components/ui/DatePicker'
import { useLanguage } from '@/contexts/LanguageContext'

type User = { id: string; name: string; email: string; role: string }
type Task = { id: string; title: string; completed: boolean; userId: string; userName?: string }
type CompanyTask = Task & { priority?: number | null; energyLevel?: number | null; dueDate?: string | null }

export default function CompanyPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<'ADMIN' | 'SUPER_ADMIN' | 'USER' | 'MEMBER' | string>('USER')
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<CompanyTask[]>([])
  const [tab, setTab] = useState<'tasks' | 'users' | 'performance'>('tasks')
  const [companyId, setCompanyId] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: '3',
    energyLevel: '2',
    userId: '',
    dueDate: undefined as Date | undefined,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const me = await apiCall<{ user: { id: string; role: string } }>('/auth/me')
      const myRole = me?.user?.role || 'USER'
      setRole(myRole)

      // Always load member tasks view via my-company endpoints
      try {
        const data = await apiCall<any>('/my-company/tasks')
        const t: CompanyTask[] = (data?.tasks || []).map((x: any) => ({ id: x.id, title: x.title, completed: x.completed, userId: x.userId, userName: x.user?.name, priority: x.priority ?? null, energyLevel: x.energyLevel ?? null, dueDate: x.dueDate ?? null }))
        setTasks(t)
      } catch (e) {
        console.warn('No team tasks available')
      }

      // Admin-only data
      if (myRole === 'ADMIN' || myRole === 'SUPER_ADMIN') {
        try {
          const company = await apiCall<any>('/admin/managed-company')
          const companyId = company?.company?.id
          if (companyId) {
            setCompanyId(companyId)
            const u = await apiCall<any>(`/companies/${companyId}/users`)
            setUsers(u?.users || [])
          }
        } catch (e) {
          console.warn('Unable to load company users')
        }
      }
    } catch (e) {
      Alert.alert(t('error'), t('companyLoadError', undefined, "Impossible de charger les données d'entreprise"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN'

  const userOptions = useMemo(() => users.map((u) => ({ value: u.id, label: u.name || u.email })), [users])

  const priorityLabel = (p?: number | null) => {
    if (p === null || p === undefined) return 'P?'
    const map: any = {
      0: t('companyPriority0', undefined, 'P0 Optionnel'),
      1: t('companyPriority1', undefined, 'P1 À faire'),
      2: t('companyPriority2', undefined, 'P2 Important'),
      3: t('companyPriority3', undefined, 'P3 Urgent'),
      4: t('companyPriority4', undefined, 'P4 Quick Win'),
    }
    return map[p] || `P${p}`
  }

  const createCompanyTask = async () => {
    if (!newTask.title.trim() || !newTask.userId) {
      Alert.alert(t('error'), t('companyCreateRequired', undefined, 'Titre et destinataire requis'))
      return
    }
    setSubmitting(true)
    try {
      await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          priority: parseInt(newTask.priority),
          energyLevel: parseInt(newTask.energyLevel),
          userId: newTask.userId,
          dueDate: newTask.dueDate || null,
        }),
      })
      setCreateOpen(false)
      setNewTask({ title: '', description: '', priority: '3', energyLevel: '2', userId: '', dueDate: undefined })
      await load()
      Alert.alert(t('success'), t('companyTaskCreated', undefined, 'Tâche créée et assignée'))
    } catch (e: any) {
      Alert.alert(t('error'), e?.message || t('companyCreateError', undefined, 'Impossible de créer la tâche'))
    } finally {
      setSubmitting(false)
    }
  }

  const TabButton = ({ id, label, icon }: { id: 'tasks' | 'users' | 'performance'; label: string; icon: keyof typeof Ionicons.glyphMap }) => (
    <TouchableOpacity onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.tabActive]}>
      <Ionicons name={icon} size={16} color={tab === id ? '#10B981' : '#6B7280'} />
      <Text style={[styles.tabText, tab === id && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('companyTitle', undefined, 'Mon Entreprise')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TabButton id="tasks" label={t('companyTabTasks', undefined, 'Tâches membres')} icon="list" />
        {isAdmin && <TabButton id="users" label={t('companyTabUsers', undefined, 'Utilisateurs')} icon="people" />}
        {isAdmin && <TabButton id="performance" label={t('companyTabPerformance', undefined, 'Performance')} icon="trending-up" />}
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color="#10B981" /></View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
          {tab === 'tasks' && (
            <View style={styles.card}>
              {tasks.length === 0 ? (
                <Text style={styles.empty}>{t('companyNoTasks', undefined, 'Aucune tâche trouvée.')}</Text>
              ) : (
                tasks.map((t) => (
                  <View key={t.id} style={styles.rowBetween}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{t.title}</Text>
                      <Text style={{ color: '#6B7280' }}>
                        {priorityLabel(t.priority)}{t.userName ? ` • ${t.userName}` : ''}
                      </Text>
                    </View>
                      <Text style={[styles.badge, { marginRight: 8 }]}>{t.completed ? t('completed', undefined, 'Terminé') : t('todo', undefined, 'À faire')}</Text>
                  </View>
                ))
              )}
              {isAdmin && (
                <TouchableOpacity style={styles.primaryBtn} onPress={() => setCreateOpen(true)}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>{t('companyAssignTask', undefined, 'Assigner une tâche')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {tab === 'users' && isAdmin && (
            <View style={styles.card}>
              <Text style={styles.itemTitle}>{t('companyUsers', undefined, 'Utilisateurs')}</Text>
              {users.length === 0 ? (
                <Text style={styles.empty}>{t('companyNoUsers', undefined, 'Aucun utilisateur.')}</Text>
              ) : (
                users.map((u) => (
                  <View key={u.id} style={styles.rowBetween}>
                    <Text style={styles.itemTitle}>{u.name || u.email}</Text>
                    <Text style={styles.badge}>{u.role}</Text>
                  </View>
                ))
              )}
              {/* Ajout utilisateur par email (flux simple) */}
              <View style={{ marginTop: 12 }}>
                <Text style={{ color: '#6B7280', marginBottom: 6 }}>{t('companyAddUser', undefined, 'Ajouter un utilisateur (ID ou Email converti côté back)')}</Text>
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <View style={{ flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12 }}>
                    <TextInput
                      placeholder={t('companyUserIdPlaceholder', undefined, 'ID utilisateur')}
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      style={{ paddingVertical: 10 }}
                    />
                  </View>
                  <TouchableOpacity
                    style={{ backgroundColor: '#10B981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 }}
                    onPress={async () => {
                      if (!companyId || !inviteEmail) return
                      try {
                        await apiCall(`/companies/${companyId}/users`, { method: 'POST', body: JSON.stringify({ userId: inviteEmail }) })
                        Alert.alert(t('success'), t('companyUserAdded', undefined, 'Utilisateur ajouté (si ID valide)'))
                        const u = await apiCall<any>(`/companies/${companyId}/users`)
                        setUsers(u?.users || [])
                        setInviteEmail('')
                      } catch (e) {
                        Alert.alert(t('error'), t('companyAddUserError', undefined, "Impossible d'ajouter l'utilisateur"))
                      }
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600' }}>{t('add', undefined, 'Ajouter')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {tab === 'performance' && isAdmin && (
            <View style={styles.card}>
              <Text style={styles.itemTitle}>{t('companyPerformance', undefined, "Performance d'équipe")}</Text>
              <View style={{ marginTop: 8 }}>
                {
                  (() => {
                    const total = tasks.length || 1
                    const completed = tasks.filter(t => t.completed).length
                    const rate = Math.round((completed / total) * 100)
                    const pHigh = tasks.filter(t => t.priority === 3 || t.priority === 4)
                    const pHighTotal = pHigh.length || 1
                    const pHighCompleted = pHigh.filter(t => t.completed).length
                    const pHighRate = Math.round((pHighCompleted / pHighTotal) * 100)
                    const overdue = tasks.filter(t => !!t.dueDate && !t.completed && new Date(t.dueDate as any) < new Date()).length
                    const activeEmployees = new Set(tasks.map(t => t.userId)).size
                    return (
                      <>
                        <View style={styles.rowBetween}><Text style={styles.metricLabel}>{t('companyCompletionRate', undefined, 'Taux de complétion')}</Text><Text style={styles.metricValue}>{rate}%</Text></View>
                        <View style={styles.rowBetween}><Text style={styles.metricLabel}>{t('companyHighPriorityRate', undefined, 'Complétion P3/P4')}</Text><Text style={styles.metricValue}>{pHighRate}%</Text></View>
                        <View style={styles.rowBetween}><Text style={styles.metricLabel}>{t('companyOverdueTasks', undefined, 'Tâches en retard')}</Text><Text style={[styles.metricValue, { color: '#EF4444' }]}>{overdue}</Text></View>
                        <View style={styles.rowBetween}><Text style={styles.metricLabel}>{t('companyActiveEmployees', undefined, 'Employés actifs')}</Text><Text style={styles.metricValue}>{activeEmployees}</Text></View>
                      </>
                    )
                  })()
                }
              </View>
              <Text style={{ color: '#6B7280', marginTop: 8 }}>{t('companyLocalMetrics', undefined, "Calculs locaux basés sur les tâches d'équipe. On peut brancher des KPIs serveur si désiré.")}</Text>
            </View>
          )}

      {/* Modal création tâche assignée */}
      <Modal visible={createOpen} animationType="slide" onRequestClose={() => setCreateOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCreateOpen(false)} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.title}>{t('companyAssignTask', undefined, 'Assigner une tâche')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('title', undefined, 'Titre')} *</Text>
              <View style={styles.inputShell}>
                <TextInput value={newTask.title} onChangeText={(v) => setNewTask(p => ({ ...p, title: v }))} placeholder={t('companyTaskTitlePlaceholder', undefined, 'Titre de la tâche')} style={styles.input} />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('description', undefined, 'Description')}</Text>
              <View style={styles.inputShell}>
                <TextInput value={newTask.description} onChangeText={(v) => setNewTask(p => ({ ...p, description: v }))} placeholder={t('companyTaskDescriptionPlaceholder', undefined, 'Description')} style={[styles.input, { height: 90 }]} multiline />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>{t('companyPriority', undefined, 'Priorité')}</Text>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask(p => ({ ...p, priority: v }))} options={[
                  { value: '4', label: t('companyPriority4', undefined, 'P4 - Quick Win') },
                  { value: '3', label: t('companyPriority3', undefined, 'P3 - Urgent') },
                  { value: '2', label: t('companyPriority2', undefined, 'P2 - Important') },
                  { value: '1', label: t('companyPriority1', undefined, 'P1 - À faire') },
                  { value: '0', label: t('companyPriority0', undefined, 'P0 - Optionnel') },
                ]} />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>{t('companyEnergy', undefined, 'Énergie')}</Text>
                <Select value={newTask.energyLevel} onValueChange={(v) => setNewTask(p => ({ ...p, energyLevel: v }))} options={[
                  { value: '3', label: t('companyEnergy3', undefined, 'Extrême') },
                  { value: '2', label: t('companyEnergy2', undefined, 'Élevé') },
                  { value: '1', label: t('companyEnergy1', undefined, 'Moyen') },
                  { value: '0', label: t('companyEnergy0', undefined, 'Faible') },
                ]} />
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('companyAssignTo', undefined, 'Assigner à')} *</Text>
              <Select value={newTask.userId} onValueChange={(v) => setNewTask(p => ({ ...p, userId: v }))} options={userOptions} placeholder={t('select', undefined, 'Sélectionner')} />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('companyDueDate', undefined, "Date d'échéance")}</Text>
              <DatePicker value={newTask.dueDate} onValueChange={(d) => setNewTask(p => ({ ...p, dueDate: d }))} placeholder={t('selectTime', undefined, 'Choisir une date')} />
            </View>
          </ScrollView>
          <View style={{ padding: 16 }}>
            <TouchableOpacity style={[styles.primaryBtn, submitting && { opacity: 0.7 }]} onPress={createCompanyTask} disabled={submitting}>
              {submitting ? <ActivityIndicator size="small" color="#fff" /> : <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.primaryBtnText}>{t('companyCreateTask', undefined, 'Créer la tâche')}</Text>
              </>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  title: { fontSize: 18, fontWeight: '600', color: '#111827' },
  tabs: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginRight: 8 },
  tabActive: { backgroundColor: '#ECFDF5' },
  tabText: { marginLeft: 6, color: '#6B7280', fontWeight: '600' },
  tabTextActive: { color: '#10B981' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemTitle: { fontSize: 16, color: '#111827', fontWeight: '500' },
  badge: { color: '#10B981', fontWeight: '700' },
  empty: { color: '#6B7280' },
})
