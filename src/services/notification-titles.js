// Titres de notifications en français
export const getNotificationTitle = (type) => {
    const titles = {
        'MORNING_REMINDER': '🌅 Bonjour et bonne journée !',
        'NOON_CHECK': '🍽️ Pause déjeuner bien méritée',
        'AFTERNOON_REMINDER': '☀️ L\'après-midi t\'attend !',
        'EVENING_PLANNING': '🌙 Préparons demain ensemble',
        'NIGHT_HABITS_CHECK': '✨ Bilan de ta journée',
        'CUSTOM_REMINDER': '💡 Petit rappel pour toi',
        'DAILY_MOTIVATION': '💪 Motivation du jour',
        'TASK_DUE': '⏰ Échéance importante',
        'HABIT_REMINDER': '🎯 Rappel d\'habitude',
        'DAILY_SUMMARY': '📊 Résumé quotidien',
    'IMPROVEMENT_REMINDER': '🛠️ Amélioration du jour',
    'RECAP_ANALYSIS': '📊 Récap de ta journée',
    'MORNING_ANCHOR': '🌅 Ta journée est prête',
    'FOCUS_WINDOW': '🎯 Tu as du temps pour te concentrer',
    'FOCUS_END': '⏱️ Session terminée',
    'LUNCH_BREAK': '🍽️ Temps de faire une pause',
    'POST_LUNCH_RESTART': '🔁 Prêt à reprendre ?',
    'STRESS_CHECK_PREMIUM': '🧠 Check-in stress',
    'MOOD_CHECK_PREMIUM': '🙂 Check-in humeur',
    'FOCUS_CHECK_PREMIUM': '🎯 Check-in focus',
    'EVENING_PLAN': '🌙 Planifie demain'
    };
    return titles[type] || type;
};

// Fonction pour formater un message WhatsApp avec le bon titre
export const formatWhatsAppMessage = (type, content) => {
    const title = getNotificationTitle(type);
    let message = `${title}\n\n`;
    message += content;
    message += '\n\n_Envoyé via Productif.io_';
    return message;
}; 
