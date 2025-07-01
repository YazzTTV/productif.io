import fetch from 'node-fetch';

const AI_URL = 'http://localhost:3001';
const USER_PHONE = '33783642205';

async function testNoteJourneeSimple() {
    console.log('🎯 Test simple de l\'habitude "Note de sa journée"');
    console.log('=' * 50);
    console.log(`📅 Date/heure: ${new Date().toLocaleString('fr-FR')}`);
    console.log('');

    try {
        console.log('📱 Envoi du message: "j\'ai fait l\'habitude note de sa journée"');
        
        const response = await fetch(`${AI_URL}/webhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                object: 'whatsapp_business_account',
                entry: [{
                    id: '3469681606499078',
                    changes: [{
                        value: {
                            messaging_product: 'whatsapp',
                            metadata: {
                                display_phone_number: '33783242840',
                                phone_number_id: '589370880934492'
                            },
                            messages: [{
                                from: USER_PHONE,
                                id: 'test_simple_note',
                                timestamp: Math.floor(Date.now() / 1000),
                                text: {
                                    body: "j'ai fait l'habitude note de sa journée"
                                },
                                type: 'text'
                            }]
                        },
                        field: 'messages'
                    }]
                }]
            })
        });

        if (response.ok) {
            console.log('✅ Requête envoyée avec succès');
            console.log('');
            console.log('🔍 Maintenant regardez les logs de l\'agent IA pour voir:');
            console.log('   1. Si GPT détecte l\'action "completer_habitude"');
            console.log('   2. Si le nom de l\'habitude est extrait dans details.nom');
            console.log('   3. Si l\'habitude spéciale est détectée');
            console.log('   4. Si la conversation spéciale démarre');
        } else {
            console.log('❌ Erreur HTTP:', response.status);
        }

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testNoteJourneeSimple(); 