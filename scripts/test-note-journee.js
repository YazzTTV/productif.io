import fetch from 'node-fetch';

const AI_URL = 'http://localhost:3001';
const USER_PHONE = '33783642205';

async function testNoteJournee() {
    console.log('⭐ Test de l\'habitude "Note de sa journée"');
    console.log('=' * 50);
    console.log(`📅 Date/heure actuelle: ${new Date().toLocaleString('fr-FR')}`);
    console.log('');

    try {
        // Étape 1: Déclencher l'habitude "Note de sa journée"
        console.log('🎯 ÉTAPE 1: Déclencher l\'habitude');
        console.log('Message: "j\'ai fait l\'habitude note de sa journée"');
        
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
                                id: 'test_note_1',
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

        if (response1.ok) {
            console.log('✅ Habitude déclenchée avec succès');
        } else {
            console.log('❌ Erreur:', response1.status);
            return;
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Étape 2: Donner une note de 1 à 10
        console.log('\n⭐ ÉTAPE 2: Donner une note');
        console.log('Message: "7"');

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
                                id: 'test_note_2',
                                timestamp: Math.floor(Date.now() / 1000),
                                text: {
                                    body: "7"
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
            console.log('✅ Note 7/10 envoyée');
        } else {
            console.log('❌ Erreur:', response2.status);
        }

        await new Promise(resolve => setTimeout(resolve, 3000));

        // Étape 3: Ajouter un résumé de journée
        console.log('\n📝 ÉTAPE 3: Ajouter un résumé');
        console.log('Message: "Journée productive avec test timezone. Corrections appliquées avec succès !"');

        const response3 = await fetch(`${AI_URL}/webhook`, {
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
                                id: 'test_note_3',
                                timestamp: Math.floor(Date.now() / 1000),
                                text: {
                                    body: "Journée productive avec test timezone. Corrections appliquées avec succès !"
                                },
                                type: 'text'
                            }]
                        },
                        field: 'messages'
                    }]
                }]
            })
        });

        if (response3.ok) {
            console.log('✅ Résumé de journée envoyé');
        } else {
            console.log('❌ Erreur:', response3.status);
        }

        console.log('\n🎉 Test terminé !');
        console.log('📋 Flux testé:');
        console.log('   1. ✅ Déclenchement habitude "Note de sa journée"');
        console.log('   2. ✅ Note: 7/10');
        console.log('   3. ✅ Résumé de journée');
        console.log('');
        console.log('🔍 Vérifiez dans les logs que:');
        console.log('   - La conversation multi-étapes fonctionne');
        console.log('   - La date est bien enregistrée pour aujourd\'hui');
        console.log('   - La note (7) et le résumé sont stockés');
        console.log('');
        console.log('📊 Vous pouvez vérifier dans Mon Espace > Notes de journée');

    } catch (error) {
        console.error('❌ Erreur lors du test:', error.message);
    }
}

testNoteJournee(); 