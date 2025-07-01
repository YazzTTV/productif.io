import fetch from 'node-fetch';

const AI_URL = 'http://localhost:3001';
const USER_PHONE = '33783642205';

async function completeTestHier() {
    console.log('📝 Complétion du test "hier"');
    console.log('=' * 30);
    
    // Répondre "8" pour la note
    console.log('🎯 Envoi de la note : "8"');
    await testMessage("8");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Répondre avec un résumé
    console.log('📝 Envoi du résumé : "Test hier avec succès"');
    await testMessage("Test hier avec succès");
    
    console.log('\n✅ Test "hier" complété !');
    console.log('📊 La date devrait être enregistrée pour hier (29/06/2025)');
}

async function testMessage(message) {
    try {
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
                                id: `test_${Date.now()}`,
                                timestamp: Math.floor(Date.now() / 1000),
                                text: {
                                    body: message
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
            console.log(`✅ Message envoyé: "${message}"`);
        } else {
            console.log(`❌ Erreur HTTP ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Erreur:`, error.message);
    }
}

completeTestHier(); 