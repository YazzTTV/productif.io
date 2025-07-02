async function checkReactiveStatus() {
    console.log('📊 STATUT DU SYSTÈME RÉACTIF');
    console.log('═'.repeat(60));

    try {
        // Faire un appel HTTP au scheduler pour obtenir le statut
        const response = await fetch('http://localhost:3001/api/status');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const status = await response.json();
        
        console.log('🚀 PLANIFICATEUR PRINCIPAL:');
        console.log(`   Statut: ${status.isStarted ? '✅ ACTIF' : '❌ ARRÊTÉ'}`);
        console.log(`   Jobs actifs: ${status.activeJobs}`);
        console.log(`   Mises à jour temps réel: ${status.realtimeUpdates ? '✅' : '❌'}`);
        console.log(`   Event listeners: ${status.eventListeners ? '✅' : '❌'}`);
        
        if (status.reactiveSystem) {
            const reactive = status.reactiveSystem;
            
            console.log('\n🌟 SYSTÈME RÉACTIF:');
            console.log(`   Statut général: ${reactive.isStarted ? '✅ ACTIF' : '❌ ARRÊTÉ'}`);
            
            if (reactive.components) {
                console.log('\n📋 COMPOSANTS:');
                
                const dbWatcher = reactive.components.databaseWatcher;
                console.log(`   👀 DatabaseWatcher: ${dbWatcher.isWatching ? '✅' : '❌'} (${dbWatcher.cachedUsers} utilisateurs en cache)`);
                
                const processor = reactive.components.changeProcessor;
                console.log(`   ⚙️ ChangeProcessor: ${processor.isProcessing ? '🔄 EN COURS' : '⏸️ EN ATTENTE'} (${processor.queueLength} en queue)`);
                
                const bridge = reactive.components.schedulerBridge;
                console.log(`   🌉 SchedulerBridge: ${bridge.isExecutingActions ? '🔄 EN COURS' : '⏸️ EN ATTENTE'} (${bridge.queueLength} en queue)`);
                console.log(`   📋 Utilisateurs planifiés: ${bridge.scheduledUsers}`);
            }
            
            if (reactive.issues && reactive.issues.length > 0) {
                console.log('\n⚠️ PROBLÈMES DÉTECTÉS:');
                reactive.issues.forEach(issue => {
                    console.log(`   ❌ ${issue}`);
                });
            } else {
                console.log('\n✅ Aucun problème détecté');
            }
        } else {
            console.log('\n⚠️ Système réactif non disponible');
        }
        
        console.log('\n🔧 JOBS PLANIFIÉS:');
        if (status.jobs && status.jobs.length > 0) {
            status.jobs.forEach(job => {
                if (job.includes('-')) {
                    const parts = job.split('-');
                    const userId = parts[0];
                    const time = parts[1];
                    console.log(`   📅 ${userId} à ${time}`);
                } else {
                    console.log(`   🔄 ${job} (système)`);
                }
            });
        } else {
            console.log('   ℹ️ Aucun job planifié');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la vérification du statut:', error.message);
        console.log('\n💡 Assurez-vous que le scheduler est en cours d\'exécution sur le port 3001');
    }
    
    console.log('═'.repeat(60));
}

// Fonction utilitaire pour fetch (si pas disponible)
async function setupFetch() {
    if (typeof fetch === 'undefined') {
        try {
            console.log('🔄 Installation de node-fetch...');
            const { default: fetch } = await import('node-fetch');
            global.fetch = fetch;
        } catch (error) {
            console.log('⚠️ node-fetch non disponible, utilisation d\'un fetch simple');
            global.fetch = () => Promise.reject(new Error('fetch non disponible'));
        }
    }
}

// Exécuter la vérification
(async () => {
    await setupFetch();
    await checkReactiveStatus();
})(); 