import { PrismaClient, Habit, HabitEntry } from '@prisma/client';

const prisma = new PrismaClient();

// Types pour les validations
interface CreateHabitData {
  name: string;
  description?: string;
  color?: string;
  frequency: string;
  daysOfWeek: string[];
  userId: string;
}

interface CreateHabitEntryData {
  habitId: string;
  date: Date;
  completed: boolean;
}

// Constantes de validation
const VALID_FREQUENCIES = ['daily', 'weekly', 'monthly'] as const;
const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

// Classe d'erreur personnalisée
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Service des habitudes
export class HabitService {
  // Validation des données d'une habitude
  private validateHabitData(data: CreateHabitData): void {
    // Validation du nom
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Le nom de l\'habitude est requis');
    }
    if (data.name.length > 255) {
      throw new ValidationError('Le nom de l\'habitude ne peut pas dépasser 255 caractères');
    }

    // Validation de la fréquence
    if (!VALID_FREQUENCIES.includes(data.frequency as any)) {
      throw new ValidationError(`La fréquence doit être l'une des suivantes: ${VALID_FREQUENCIES.join(', ')}`);
    }

    // Validation des jours de la semaine
    if (!Array.isArray(data.daysOfWeek) || data.daysOfWeek.length === 0) {
      throw new ValidationError('Au moins un jour de la semaine doit être sélectionné');
    }
    
    const invalidDays = data.daysOfWeek.filter(day => !VALID_DAYS.includes(day as any));
    if (invalidDays.length > 0) {
      throw new ValidationError(`Jours invalides: ${invalidDays.join(', ')}`);
    }

    // Validation de la couleur
    if (data.color && !COLOR_REGEX.test(data.color)) {
      throw new ValidationError('La couleur doit être au format hexadécimal (ex: #FF0000)');
    }
  }

  // Validation des données d'une entrée d'habitude
  private validateHabitEntryData(data: CreateHabitEntryData): void {
    if (!data.habitId) {
      throw new ValidationError('L\'ID de l\'habitude est requis');
    }

    if (!(data.date instanceof Date) || isNaN(data.date.getTime())) {
      throw new ValidationError('La date est invalide');
    }

    // Empêcher les dates futures
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (data.date > today) {
      throw new ValidationError('La date ne peut pas être dans le futur');
    }
  }

  // Création d'une habitude
  async createHabit(data: CreateHabitData): Promise<Habit> {
    this.validateHabitData(data);

    try {
      return await prisma.habit.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error('Erreur lors de la création de l\'habitude');
    }
  }

  // Création d'une entrée d'habitude
  async createHabitEntry(data: CreateHabitEntryData): Promise<HabitEntry> {
    this.validateHabitEntryData(data);

    try {
      // Vérifier si l'habitude existe
      const habit = await prisma.habit.findUnique({
        where: { id: data.habitId },
      });

      if (!habit) {
        throw new ValidationError('Habitude non trouvée');
      }

      // Vérifier si une entrée existe déjà pour cette date
      const existingEntry = await prisma.habitEntry.findUnique({
        where: {
          habitId_date: {
            habitId: data.habitId,
            date: data.date,
          },
        },
      });

      if (existingEntry) {
        throw new ValidationError('Une entrée existe déjà pour cette date');
      }

      // Vérifier si le jour correspond aux jours configurés
      const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][data.date.getDay()];
      if (!habit.daysOfWeek.includes(dayOfWeek)) {
        throw new ValidationError(`Cette habitude n'est pas prévue pour le ${dayOfWeek}`);
      }

      return await prisma.habitEntry.create({
        data: {
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error('Erreur lors de la création de l\'entrée d\'habitude');
    }
  }

  // Récupération des statistiques d'une habitude
  async getHabitStats(habitId: string): Promise<{
    totalEntries: number;
    completedEntries: number;
    completionRate: number;
    currentStreak: number;
  }> {
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        entries: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!habit) {
      throw new ValidationError('Habitude non trouvée');
    }

    const totalEntries = habit.entries.length;
    const completedEntries = habit.entries.filter(entry => entry.completed).length;
    const completionRate = totalEntries > 0 ? (completedEntries / totalEntries) * 100 : 0;

    // Calcul de la série actuelle
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const entry of habit.entries) {
      if (!entry.completed) break;
      currentStreak++;
    }

    return {
      totalEntries,
      completedEntries,
      completionRate,
      currentStreak,
    };
  }
}

export const habitService = new HabitService(); 