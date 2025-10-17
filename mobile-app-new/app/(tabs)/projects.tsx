import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { projectsService } from '@/lib/api';
import { dashboardEvents, DASHBOARD_DATA_CHANGED } from '@/lib/events';

const { width } = Dimensions.get('window');

interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
  _count?: {
    tasks: number;
  };
}

interface ProjectCardProps {
  project: Project;
  onPress: () => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPress, onDelete }) => {
  const getProjectColor = (color?: string) => {
    return color || '#3b82f6';
  };

  return (
    <TouchableOpacity style={styles.projectCard} onPress={onPress}>
      <View style={styles.projectHeader}>
        <View style={[
          styles.projectColorDot,
          { backgroundColor: getProjectColor(project.color) }
        ]} />
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.description && (
            <Text style={styles.projectDescription} numberOfLines={2}>
              {project.description}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => onDelete(project.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.projectStats}>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#6b7280" />
          <Text style={styles.statText}>
            {project._count?.tasks || 0} tâches
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.statText}>
            {new Date(project.createdAt).toLocaleDateString('fr-FR')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ProjectsScreen() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');

  const fetchProjects = async () => {
    try {
      const response = await projectsService.getProjects();
      console.log('📋 Projets récupérés (page projets):', response);
      // La réponse de l'API est directement un tableau de projets
      setProjects(Array.isArray(response) ? response : response.projects || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des projets:', error);
      Alert.alert('Erreur', 'Impossible de charger les projets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProjects();
  }, []);

  const handleProjectPress = (project: Project) => {
    // TODO: Navigation vers les détails du projet
    Alert.alert('Projet', `${project.name}\n\n${project.description || 'Aucune description'}`);
  };

  const handleDeleteProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    Alert.alert(
      'Supprimer le projet',
      `Êtes-vous sûr de vouloir supprimer "${project.name}" ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await projectsService.deleteProject(projectId);
              await fetchProjects();
              dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
              Alert.alert('Succès', 'Projet supprimé');
            } catch (e: any) {
              console.error('Erreur suppression projet:', e);
              Alert.alert('Erreur', e?.message || 'Suppression impossible');
            }
          }
        }
      ]
    );
  };

  const handleCreateProject = () => {
    setShowCreateModal(true);
  };

  const saveProject = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      Alert.alert('Erreur', 'Le nom du projet est requis');
      return;
    }
    try {
      const created = await projectsService.createProject({ name: trimmed, description: newDescription.trim() || undefined, color: newColor });
      setShowCreateModal(false);
      setNewName('');
      setNewDescription('');
      setNewColor('#3b82f6');
      await fetchProjects();
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
      Alert.alert('Succès', `Projet "${created.name || trimmed}" créé`);
    } catch (e: any) {
      console.error('Erreur création projet:', e);
      Alert.alert('Erreur', e?.message || 'Création impossible');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Chargement des projets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes Projets</Text>
          <Text style={styles.subtitle}>
            {projects.length} projet{projects.length > 1 ? 's' : ''}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={handleCreateProject}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{projects.length}</Text>
          <Text style={styles.statLabel}>Projets</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {projects.reduce((total, project) => total + (project._count?.tasks || 0), 0)}
          </Text>
          <Text style={styles.statLabel}>Tâches</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {projects.filter(p => (p._count?.tasks || 0) > 0).length}
          </Text>
          <Text style={styles.statLabel}>Actifs</Text>
        </View>
      </View>

      {/* Liste des projets */}
      <ScrollView
        style={styles.projectsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>Aucun projet</Text>
            <Text style={styles.emptySubtitle}>
              Créez votre premier projet pour organiser vos tâches
            </Text>
             <TouchableOpacity style={styles.emptyButton} onPress={handleCreateProject}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Créer un projet</Text>
            </TouchableOpacity>
          </View>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={() => handleProjectPress(project)}
              onDelete={handleDeleteProject}
            />
          ))
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
      {/* Modal de création de projet */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:'#fff', borderTopLeftRadius:16, borderTopRightRadius:16, padding:16 }}>
            <Text style={{ fontSize:18, fontWeight:'700', marginBottom:12 }}>Nouveau projet</Text>
            <Text style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>Nom</Text>
            <TextInput 
              placeholder="Nom du projet"
              value={newName}
              onChangeText={setNewName}
              style={{ borderWidth:1, borderColor:'#E5E7EB', borderRadius:8, padding:12, marginBottom:12 }}
            />
            <Text style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>Description (optionnel)</Text>
            <TextInput 
              placeholder="Description"
              value={newDescription}
              onChangeText={setNewDescription}
              style={{ borderWidth:1, borderColor:'#E5E7EB', borderRadius:8, padding:12, marginBottom:12 }}
            />
            <Text style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>Couleur</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12 }}>
              {['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', '#fbbf24', '#10b981', '#06b6d4'].map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setNewColor(color)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: color,
                    borderWidth: newColor === color ? 3 : 1,
                    borderColor: newColor === color ? '#1f2937' : '#d1d5db',
                  }}
                />
              ))}
            </View>
            <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:12 }}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={{ paddingHorizontal:16, paddingVertical:12 }}>
                <Text style={{ color:'#6B7280' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveProject} style={{ backgroundColor:'#10B981', paddingHorizontal:16, paddingVertical:12, borderRadius:8 }}>
                <Text style={{ color:'#fff', fontWeight:'600' }}>Créer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  projectsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  projectColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  projectInfo: {
    flex: 1,
    marginRight: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  projectStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 40,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
  },
});