const http = require('http');

function checkStatus() {
    console.log('📊 VÉRIFICATION DU STATUT DU SYSTÈME RÉACTIF');
    console.log('═'.repeat(60));
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/status',
        method: 'GET',
        timeout: 5000
    };

    const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const status = JSON.parse(data);
                displayStatus(status);
            } catch (error) {
                console.error('❌ Erreur de parsing JSON:', error.message);
                console.log('📋 Réponse brute:', data);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Erreur de connexion:', error.message);
        console.log('\n💡 Solutions possibles:');
        console.log('   1. Vérifiez que le scheduler tourne sur le port 3001');
        console.log('   2. Démarrez le scheduler avec: node src/services/scheduler-service.js');
        console.log('   3. Vérifiez que le port 3001 n\'est pas bloqué');
    });

    req.on('timeout', () => {
        console.error('❌ Timeout de connexion (5s)');
        req.destroy();
    });

    req.end();
}

function displayStatus(status) {
    console.log('🚀 PLANIFICATEUR PRINCIPAL:');
    console.log(`   Statut: ${status.isStarted ? '✅ ACTIF' : '❌ ARRÊTÉ'}`);
    console.log(`   Jobs actifs: ${status.activeJobs || 0}`);
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
        console.log('\n⚠️ Système réactif non disponible (version ancienne du scheduler?)');
    }
    
    console.log('\n🔧 JOBS PLANIFIÉS:');
    if (status.jobs && status.jobs.length > 0) {
        status.jobs.forEach(job => {
            if (job.includes('-')) {
                const parts = job.split('-');
                const userId = parts[0];
                const time = parts[1];
                console.log(`   📅 ${userId.substring(0, 8)}... à ${time}`);
            } else {
                console.log(`   🔄 ${job} (système)`);
            }
        });
    } else {
        console.log('   ℹ️ Aucun job planifié');
    }
    
    console.log('═'.repeat(60));
}

// Exécuter la vérification
checkStatus(); 