import fetch from 'node-fetch';

const AI_URL = 'http://localhost:3001';
const USER_PHONE = '33783642205';

async function debugSpecialHabits() {
    console.log('🔍 Debug des habitudes spéciales');
    console.log('=' * 40);
    
    // Test simple: une habitude normale d'abord
    console.log('\n1️⃣ Test habitude normale:');
    await testMessage("j'ai fait l'habitude sport");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test spécial: note de journée pour aujourd'hui  
    console.log('\n2️⃣ Test habitude spéciale (aujourd\'hui):');
    await testMessage("j'ai fait l'habitude note de sa journée");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Répondre à la conversation spéciale
    console.log('\n3️⃣ Réponse note:');
    await testMessage("9");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Répondre à la conversation spéciale
    console.log('\n4️⃣ Réponse résumé:');
    await testMessage("Test debug aujourd'hui");
    
    console.log('\n✅ Tests terminés - vérifiez les messages et la DB');
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
            console.log(`✅ "${message}"`);
        } else {
            console.log(`❌ Erreur HTTP ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Erreur:`, error.message);
    }
}

debugSpecialHabits(); 