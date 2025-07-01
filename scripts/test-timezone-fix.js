import fetch from 'node-fetch';

const AI_URL = 'http://localhost:3001';
const USER_PHONE = '33783642205';

async function testTimezoneFix() {
    console.log('🕐 Test de la correction du décalage horaire');
    console.log('=' * 50);
    console.log(`📅 Date/heure actuelle: ${new Date().toLocaleString('fr-FR')}`);
    console.log(`📅 Date UTC actuelle: ${new Date().toISOString()}`);
    console.log('');

    try {
        // Test avec l'habitude Apprentissage
        console.log('📚 Test: Complétion habitude Apprentissage');
        
        const response1 = await fetch(`${AI_URL}/webhook`, {
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
                                id: 'test_timezone_1',
                                timestamp: Math.floor(Date.now() / 1000),
                                text: {
                                    body: "j'ai fait l'habitude apprentissage"
                                },
                                type: 'text'
                            }]
                        },
                        field: 'messages'
                    }]
                }]
            })
        });

        if (response1.ok) {
            console.log('✅ Requête apprentissage envoyée');
        } else {
            console.log('❌ Erreur:', response1.status);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Répondre avec un contenu d'apprentissage
        console.log('📝 Envoi du contenu: "Test correction timezone"');

        const response2 = await fetch(`${AI_URL}/webhook`, {
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
                                id: 'test_timezone_2',
                                timestamp: Math.floor(Date.now() / 1000),
                                text: {
                                    body: "Test correction timezone - UTC fix"
                                },
                                type: 'text'
                            }]
                        },
                        field: 'messages'
                    }]
                }]
            })
        });

        if (response2.ok) {
            console.log('✅ Contenu d\'apprentissage envoyé');
        }

        console.log('\n🎯 Vérifiez dans les logs de l\'agent IA que la date enregistrée correspond bien à aujourd\'hui !');
        console.log('📊 Vous pouvez aussi vérifier dans Mon Espace que l\'entrée apparaît pour aujourd\'hui.');

    } catch (error) {
        console.error('❌ Erreur:', error.message);
    }
}

testTimezoneFix(); 