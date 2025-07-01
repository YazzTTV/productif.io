import fetch from 'node-fetch';

const AI_URL = 'http://localhost:3001';
const USER_PHONE = '33783642205';

async function testDatesFinal() {
    console.log('🎯 Test final des dates avec habitudes spéciales');
    console.log('=' * 50);
    
    // Test 1: Note de journée pour HIER
    console.log('\n1️⃣ Test "Note de sa journée" pour HIER:');
    await testMessage("j'ai fait l'habitude note de sa journée hier");
    
    await sleep(3000);
    console.log('   Réponse note:');
    await testMessage("8");
    
    await sleep(3000);
    console.log('   Réponse résumé:');
    await testMessage("Journée hier productive");
    
    await sleep(5000);
    
    // Test 2: Apprentissage pour AVANT-HIER  
    console.log('\n2️⃣ Test "Apprentissage" pour AVANT-HIER:');
    await testMessage("j'ai fait l'habitude apprentissage avant-hier");
    
    await sleep(3000);
    console.log('   Réponse contenu:');
    await testMessage("J'ai appris les API REST");
    
    await sleep(5000);
    
    // Test 3: Note de journée pour une DATE PRÉCISE
    console.log('\n3️⃣ Test "Note de sa journée" pour le 28/06/2025:');
    await testMessage("j'ai fait l'habitude note de sa journée le 28/06/2025");
    
    await sleep(3000);
    console.log('   Réponse note:');
    await testMessage("7");
    
    await sleep(3000);
    console.log('   Réponse résumé:');
    await testMessage("Journée du 28 juin tranquille");
    
    console.log('\n✅ Tous les tests de dates terminés !');
    console.log('📊 Vérifiez maintenant les entrées dans la base de données');
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

testDatesFinal(); 