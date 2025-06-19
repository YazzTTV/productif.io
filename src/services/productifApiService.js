const axios = require('axios');

class ProductifApiService {
    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://productif.io';
    }

    createApiClient(token) {
        return axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    }

    async validateToken(token) {
        try {
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
            
            const response = await axios.get(`${this.baseUrl}/api/test-token`, { headers });
            return response.status === 200;
        } catch (error) {
            console.error('Erreur de validation du token:', error.response?.data || error.message);
            return false;
        }
    }

    async getUserHabits(token) {
        try {
            const api = this.createApiClient(token);
            const response = await api.get('/api/habits');
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des habitudes:', error);
            throw error;
        }
    }

    async getUserTasks(token) {
        try {
            const api = this.createApiClient(token);
            console.log('🔍 Récupération des tâches avec le token:', token);
            console.log('📍 URL de l\'API:', `${this.baseUrl}/api/tasks/agent`);
            
            const response = await api.get('/api/tasks/agent');
            console.log('✅ Réponse de l\'API tasks:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des tâches:', error.response?.data || error.message);
            console.error('Headers:', error.response?.headers);
            console.error('Status:', error.response?.status);
            throw error;
        }
    }

    async markHabitComplete(token, habitId, date, note = null, rating = null) {
        try {
            const api = this.createApiClient(token);
            console.log('📝 Marquage de l\'habitude comme terminée:', habitId);
            const response = await api.post(`/api/habits/agent`, {
                habitId,
                date: date || new Date().toISOString().split('T')[0],
                completed: true,
                note,
                rating
            });
            console.log('✅ Réponse de l\'API:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erreur lors du marquage de l\'habitude comme terminée:', error);
            throw error;
        }
    }

    async markTaskComplete(token, taskId) {
        try {
            const api = this.createApiClient(token);
            console.log('📝 Marquage de la tâche comme terminée:', taskId);
            const response = await api.patch(`/api/tasks/agent/${taskId}`, {
                completed: true
            });
            console.log('✅ Réponse de l\'API:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors du marquage de la tâche comme terminée:', error.response?.data || error.message);
            console.error('Headers:', error.response?.headers);
            console.error('Status:', error.response?.status);
            throw error;
        }
    }

    async createTask(token, taskData) {
        try {
            const api = this.createApiClient(token);
            console.log('📝 Création d\'une nouvelle tâche:', taskData);
            const response = await api.post('/api/tasks/agent', taskData);
            console.log('✅ Réponse de l\'API:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la création de la tâche:', error.response?.data || error.message);
            console.error('Headers:', error.response?.headers);
            console.error('Status:', error.response?.status);
            throw error;
        }
    }

    async createHabit(token, habitData) {
        try {
            const api = this.createApiClient(token);
            const response = await api.post('/api/habits', habitData);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la création de l\'habitude:', error);
            throw error;
        }
    }

    async getDailyHabits(token) {
        try {
            console.log('🔍 Récupération des habitudes avec le token:', token);
            const api = this.createApiClient(token);
            console.log('📍 URL de l\'API:', `${this.baseUrl}/api/habits/agent`);
            
            const response = await api.get('/api/habits/agent');
            console.log('✅ Réponse de l\'API habits:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des habitudes:', error.response?.data || error.message);
            console.error('Headers:', error.response?.headers);
            console.error('Status:', error.response?.status);
            throw error;
        }
    }

    async getUserProjects(token) {
        try {
            const api = this.createApiClient(token);
            console.log('🔍 Récupération des projets avec le token:', token);
            const response = await api.get('/api/projects/agent');
            console.log('✅ Réponse de l\'API projects:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des projets:', error.response?.data || error.message);
            console.error('Headers:', error.response?.headers);
            console.error('Status:', error.response?.status);
            throw error;
        }
    }

    async getUserProcesses(token) {
        try {
            const api = this.createApiClient(token);
            console.log('🔍 Récupération des processus avec le token:', token);
            const response = await api.get('/api/processes/agent?includeStats=true');
            console.log('✅ Réponse de l\'API processes:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la récupération des processus:', error.response?.data || error.message);
            console.error('Headers:', error.response?.headers);
            console.error('Status:', error.response?.status);
            throw error;
        }
    }

    async createProcess(token, processData) {
        try {
            const api = this.createApiClient(token);
            console.log('📝 Création d\'un nouveau processus:', processData);
            const response = await api.post('/api/processes/agent', processData);
            console.log('✅ Réponse de l\'API:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Erreur lors de la création du processus:', error.response?.data || error.message);
            console.error('Headers:', error.response?.headers);
            console.error('Status:', error.response?.status);
            throw error;
        }
    }
}

module.exports = new ProductifApiService(); 