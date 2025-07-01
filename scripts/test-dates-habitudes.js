import fetch from 'node-fetch';

const AI_URL = 'http://localhost:3001';
const USER_PHONE = '33783642205';

async function testDatesHabitudes() {
    console.log('📅 Test des dates avec habitudes spéciales');
    console.log('=' * 50);
    console.log(`📅 Date/heure actuelle: ${new Date().toLocaleString('fr-FR')}`);
    console.log('');

    // Test 1: Hier
    console.log('🧪 TEST 1: "j\'ai fait l\'habitude note de sa journée hier"');
    await testMessage("j'ai fait l'habitude note de sa journée hier");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 2: Avant-hier
    console.log('\n🧪 TEST 2: "j\'ai fait l\'habitude apprentissage avant-hier"');
    await testMessage("j'ai fait l'habitude apprentissage avant-hier");
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: Date précise
    console.log('\n🧪 TEST 3: "j\'ai fait l\'habitude note de sa journée le 28/06/2025"');
    await testMessage("j'ai fait l'habitude note de sa journée le 28/06/2025");

    console.log('\n🔍 Résultats attendus:');
    console.log('   ✅ Si ça fonctionne: Conversations spéciales déclenchées');
    console.log('   ❌ Si ça ne fonctionne pas: Messages génériques');
    console.log('');
    console.log('📊 Vérifiez ensuite dans Mon Espace si les dates sont correctes');
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
            console.log(`❌ Erreur HTTP ${response.status} pour: "${message}"`);
        }
    } catch (error) {
        console.error(`❌ Erreur pour "${message}":`, error.message);
    }
}

testDatesHabitudes(); 