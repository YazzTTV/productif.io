import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function testGPTHabitParsing() {
    console.log('🤖 Test de l\'analyse GPT pour les habitudes');
    console.log('=' * 50);
    
    const message = "j'ai fait l'habitude note de sa journée";
    console.log(`📝 Message testé: "${message}"`);
    console.log('');

    const prompt = `
        Tu es un assistant qui aide à comprendre les commandes liées aux habitudes.
        Analyse le message suivant et extrait :
        1. Le nom de l'habitude que l'utilisateur veut marquer comme complétée
        2. La date mentionnée (si présente)
        
        RÈGLES STRICTES pour la détection des dates :
        - Tu DOIS TOUJOURS détecter et extraire les mots-clés temporels suivants :
          * "hier" -> date: "hier", isRelative: true
          * "avant-hier" -> date: "avant-hier", isRelative: true
          * Dates au format JJ/MM/YYYY -> date: "JJ/MM/YYYY", isRelative: false
        - La position du mot temporel dans la phrase n'a pas d'importance
        - Si le message contient "hier", tu DOIS ABSOLUMENT retourner date: "hier" et isRelative: true
        - Si aucun mot temporel n'est présent, utilise date: null
        
        Message: "${message}"
        
        Réponds au format JSON uniquement, avec cette structure :
        {
            "habitName": "nom de l'habitude (ou null si non trouvé)",
            "date": "date mentionnée (ou null si non mentionnée)",
            "isRelative": true/false (true si la date est relative comme "hier", "avant-hier", etc.)
        }
        
        Exemples :
        Message: "j'ai l'habitude deep work hier"
        {
            "habitName": "deep work",
            "date": "hier",
            "isRelative": true
        }

        Message: "hier j'ai fais l'habitude dormir 00h"
        {
            "habitName": "dormir 00h",
            "date": "hier",
            "isRelative": true
        }
        
        Message: "j'ai fait mon sport hier soir"
        {
            "habitName": "sport",
            "date": "hier",
            "isRelative": true
        }

        Message: "avant-hier j'ai complété ma routine du soir"
        {
            "habitName": "routine du soir",
            "date": "avant-hier",
            "isRelative": true
        }

        Message: "Le 20/06/2024 j'ai fait ma routine du matin"
        {
            "habitName": "routine du matin",
            "date": "20/06/2024",
            "isRelative": false
        }

        Message: "Marquer habitude Méditation comme complétée"
        {
            "habitName": "méditation",
            "date": null,
            "isRelative": false
        }
        `;

    try {
        console.log('🔍 Envoi à GPT...');
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: prompt
            }],
            temperature: 0.1
        });

        const response = completion.choices[0]?.message?.content;
        console.log('🤖 Réponse brute de GPT:');
        console.log(response);
        console.log('');

        try {
            const analysis = JSON.parse(response || "{}");
            console.log('📊 Analyse parsée:');
            console.log('   habitName:', analysis.habitName);
            console.log('   date:', analysis.date);
            console.log('   isRelative:', analysis.isRelative);
            console.log('');

            if (!analysis.habitName || analysis.habitName === 'null') {
                console.log('❌ PROBLÈME: Nom d\'habitude non détecté !');
                console.log('   GPT n\'a pas réussi à extraire "note de sa journée" du message');
                console.log('   C\'est pourquoi l\'habitude spéciale n\'est pas déclenchée');
            } else {
                console.log('✅ Nom d\'habitude détecté:', analysis.habitName);
                console.log('   L\'habitude spéciale devrait être déclenchée');
            }

        } catch (parseError) {
            console.error('❌ Erreur de parsing JSON:', parseError);
            console.log('   La réponse de GPT n\'est pas un JSON valide');
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'appel GPT:', error);
    }
}

testGPTHabitParsing(); 