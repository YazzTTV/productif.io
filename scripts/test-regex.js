// Test de la regex pour détecter les habitudes
const message = "j'ai fait l'habitude note de sa journée";

console.log('🧪 Test de la regex de détection');
console.log('=' * 40);
console.log(`📝 Message: "${message}"`);
console.log('');

const habitPattern = /j'ai\s+(fait|terminé|complété)\s+l'habitude\s+(.+)/i;
const match = message.match(habitPattern);

console.log('🔍 Résultat du match:');
console.log('   match:', match);

if (match) {
    console.log('✅ MATCH TROUVÉ !');
    console.log('   Action:', match[1]);
    console.log('   Nom habitude:', match[2]);
    console.log('');
    
    const habitNameFromMessage = match[2].trim();
    console.log('🎯 Nom d\'habitude extrait:', `"${habitNameFromMessage}"`);
    
    // Test avec les noms d'habitudes que nous avons
    const testHabits = [
        { name: "Note de sa journée" },
        { name: "Apprentissage" },
        { name: "Sport" }
    ];
    
    console.log('');
    console.log('🔍 Test de correspondance avec les habitudes:');
    testHabits.forEach(habit => {
        const match1 = habit.name.toLowerCase().includes(habitNameFromMessage.toLowerCase());
        const match2 = habitNameFromMessage.toLowerCase().includes(habit.name.toLowerCase());
        console.log(`   "${habit.name}" → ${match1 || match2 ? '✅' : '❌'} (match1: ${match1}, match2: ${match2})`);
    });
    
} else {
    console.log('❌ AUCUN MATCH');
    console.log('   La regex ne fonctionne pas avec ce message');
}

console.log('');
console.log('🔧 Si aucun match, essayons une regex plus simple:');
const simplePattern = /j'ai fait l'habitude (.+)/i;
const simpleMatch = message.match(simplePattern);
console.log('   Regex simple:', simpleMatch);
if (simpleMatch) {
    console.log('   ✅ Avec regex simple:', simpleMatch[1]);
} 