import { startOfDay, endOfDay, format as formatDate } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';
import { toZonedTime } from 'date-fns-tz';

// Récupérer le fuseau horaire depuis les variables d'environnement ou utiliser Europe/Paris par défaut
export const USER_TIMEZONE = process.env.USER_TIMEZONE || 'Europe/Paris';

// Fonctions pour obtenir les dates avec le bon fuseau horaire
export function getStartOfToday() {
  const now = new Date();
  const todayStart = startOfDay(now);
  
  // On retourne la date locale, en s'assurant que c'est bien le début du jour
  return todayStart;
}

export function getEndOfToday() {
  const now = new Date();
  const todayEnd = endOfDay(now);
  
  // On retourne la date locale, en s'assurant que c'est bien la fin du jour
  return todayEnd;
}

// Formate une date en tenant compte du fuseau horaire (utilise formatInTimeZone de date-fns-tz)
export function formatInTimezone(date: Date, formatString: string) {
  return formatInTimeZone(date, USER_TIMEZONE, formatString, { locale: fr });
}

// Vérifier si une date est aujourd'hui dans le fuseau horaire défini
export function isToday(date: Date) {
  const now = new Date();
  const nowDay = startOfDay(now).getDate();
  const nowMonth = startOfDay(now).getMonth();
  const nowYear = startOfDay(now).getFullYear();
  
  const dateDay = date.getDate();
  const dateMonth = date.getMonth();
  const dateYear = date.getFullYear();
  
  return nowDay === dateDay && nowMonth === dateMonth && nowYear === dateYear;
}

// Convertir une date locale en UTC en s'assurant que l'heure est à minuit dans le fuseau horaire local
export function localDateToUTC(date: Date): Date {
  // Créer une nouvelle date avec l'heure à minuit dans le fuseau horaire local
  const localMidnight = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0, 0, 0, 0
  );
  
  // Convertir en UTC
  return new Date(localMidnight.toISOString());
}

// Convertir une date UTC en date locale en s'assurant que l'heure est à minuit dans le fuseau horaire local
export function utcToLocalDate(date: Date): Date {
  // Convertir la date UTC en date locale
  const localDate = toZonedTime(date, USER_TIMEZONE);
  
  // Retourner une nouvelle date avec l'heure à minuit dans le fuseau horaire local
  return new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0, 0, 0, 0
  );
}

// Vérifier si une date est aujourd'hui dans le fuseau horaire local
export function isTodayInLocalTZ(date: Date): boolean {
  const now = new Date();
  const today = utcToLocalDate(now);
  const dateToCheck = utcToLocalDate(date);
  
  return today.getTime() === dateToCheck.getTime();
}

// Vérifier si une date est demain dans le fuseau horaire local
export function isTomorrowInLocalTZ(date: Date): boolean {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowLocal = utcToLocalDate(tomorrow);
  const dateToCheck = utcToLocalDate(date);
  
  return tomorrowLocal.getTime() === dateToCheck.getTime();
} 