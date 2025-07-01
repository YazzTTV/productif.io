// Test manuel pour voir ce que GPT retourne
const message = "j'ai fait l'habitude note de sa journée";

console.log('🧪 Test manuel de l\'analyse GPT');
console.log('=' * 50);
console.log(`📝 Message: "${message}"`);
console.log('');

console.log('🔍 Le premier appel GPT devrait retourner quelque chose comme:');
console.log(JSON.stringify({
    actions: [{
        action: "completer_habitude",
        details: {
            nom: "note de sa journée"
        }
    }]
}, null, 2));

console.log('');
console.log('⚠️  Si GPT ne retourne pas cela, alors le problème est:');
console.log('   1. GPT ne comprend pas le message');
console.log('   2. Le prompt n\'est pas assez clair');
console.log('   3. Il y a un problème dans l\'extraction du nom');

console.log('');
console.log('🔧 SOLUTION: Améliorer encore le prompt ou ajouter plus d\'exemples'); 