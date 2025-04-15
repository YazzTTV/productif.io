import { startOfDay, endOfDay, format as formatDate } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatInTimeZone } from 'date-fns-tz';

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