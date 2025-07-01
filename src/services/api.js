import { Capacitor } from '@capacitor/core';
import axios from 'axios';
import { Storage } from '@capacitor/storage';
class ApiService {
    constructor() {
        this.token = null;
        // Détecter si on est en dev ou prod
        const baseURL = Capacitor.isNativePlatform()
            ? 'https://votre-api-prod.com' // URL de production
            : 'http://10.0.2.2:3000'; // URL de développement local pour Android
        this.api = axios.create({
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Intercepteur pour ajouter le token à chaque requête
        this.api.interceptors.request.use(async (config) => {
            if (!this.token) {
                this.token = await this.getStoredToken();
            }
            if (this.token) {
                config.headers.Authorization = `Bearer ${this.token}`;
            }
            return config;
        });
        // Intercepteur pour gérer les erreurs
        this.api.interceptors.response.use((response) => response, async (error) => {
            if (error.response?.status === 401) {
                await this.handleUnauthorized();
            }
            throw error;
        });
    }
    async getStoredToken() {
        const { value } = await Storage.get({ key: 'auth_token' });
        return value;
    }
    async handleUnauthorized() {
        await Storage.remove({ key: 'auth_token' });
        this.token = null;
        // Rediriger vers la page de login
        window.location.href = '/login';
    }
    // Auth APIs
    async login(email, password) {
        const response = await this.api.post('/api/auth/login', { email, password });
        this.token = response.data.token;
        await Storage.set({ key: 'auth_token', value: this.token });
        return response.data;
    }
    async logout() {
        await Storage.remove({ key: 'auth_token' });
        this.token = null;
    }
    // Tasks APIs
    async getTasks() {
        const response = await this.api.get('/api/tasks');
        return response.data;
    }
    async createTask(task) {
        const response = await this.api.post('/api/tasks', task);
        return response.data;
    }
    async updateTask(taskId, updates) {
        const response = await this.api.put(`/api/tasks/${taskId}`, updates);
        return response.data;
    }
    async deleteTask(taskId) {
        await this.api.delete(`/api/tasks/${taskId}`);
    }
    // Projects APIs
    async getProjects() {
        const response = await this.api.get('/api/projects');
        return response.data;
    }
    async createProject(project) {
        const response = await this.api.post('/api/projects', project);
        return response.data;
    }
    async updateProject(projectId, updates) {
        const response = await this.api.put(`/api/projects/${projectId}`, updates);
        return response.data;
    }
    // Habits APIs
    async getHabits() {
        const response = await this.api.get('/api/habits');
        return response.data;
    }
    async createHabit(habit) {
        const response = await this.api.post('/api/habits', habit);
        return response.data;
    }
    async updateHabit(habitId, updates) {
        const response = await this.api.put(`/api/habits/${habitId}`, updates);
        return response.data;
    }
    async completeHabit(habitId, date) {
        const response = await this.api.post(`/api/habits/${habitId}/complete`, { date });
        return response.data;
    }
    // Time Entries APIs
    async getTimeEntries(startDate, endDate) {
        const response = await this.api.get('/api/time-entries', {
            params: { startDate, endDate }
        });
        return response.data;
    }
    async startTimeEntry(data) {
        const response = await this.api.post('/api/time-entries/start', data);
        return response.data;
    }
    async stopTimeEntry(timeEntryId) {
        const response = await this.api.post(`/api/time-entries/${timeEntryId}/stop`);
        return response.data;
    }
    // Missions & Objectives APIs
    async getMissions(year, quarter) {
        const response = await this.api.get('/api/missions', {
            params: { year, quarter }
        });
        return response.data;
    }
    async getObjectives(missionId) {
        const response = await this.api.get(`/api/missions/${missionId}/objectives`);
        return response.data;
    }
    // User Stats & Analytics
    async getUserStats() {
        const response = await this.api.get('/api/users/stats');
        return response.data;
    }
    async getHabitStats(habitId) {
        const response = await this.api.get(`/api/habits/${habitId}/stats`);
        return response.data;
    }
    // Gamification APIs
    async getAchievements() {
        const response = await this.api.get('/api/gamification/achievements');
        return response.data;
    }
    async getStreak() {
        const response = await this.api.get('/api/gamification/streak');
        return response.data;
    }
    // Error handling helper
    handleError(error) {
        if (error.response) {
            // Erreur serveur avec réponse
            throw new Error(error.response.data.message || 'Une erreur est survenue');
        }
        else if (error.request) {
            // Pas de réponse du serveur
            throw new Error('Impossible de contacter le serveur');
        }
        else {
            // Erreur de configuration de la requête
            throw new Error('Erreur de configuration de la requête');
        }
    }
}
export const apiService = new ApiService();
