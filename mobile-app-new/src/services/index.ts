// Export du service API principal
export { apiService } from './api';

// Export de tous les services métier
export { taskService } from './taskService';
export { projectService } from './projectService';
export { timeService } from './timeService';
export { habitService } from './habitService';
export { dashboardService } from './dashboardService';
export { gamificationService } from './gamificationService';
export { objectiveService } from './objectiveService';
export { notificationService } from './notificationService';

// Export des types d'erreur
export type { ApiError, ApiResponse } from './api'; 