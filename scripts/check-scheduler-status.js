#!/usr/bin/env node

/**
 * Script pour vérifier le statut du scheduler sur Railway
 * 
 * Usage:
 *   node scripts/check-scheduler-status.js
 */

import 'dotenv/config';

const SCHEDULER_URL = process.env.SCHEDULER_URL || 'https://scheduler-production-70cc.up.railway.app';

async function checkSchedulerStatus() {
  console.log('🔍 Vérification du statut du scheduler Railway\n');
  console.log(`📡 URL: ${SCHEDULER_URL}\n`);

  try {
    // Vérifier le healthcheck
    console.log('1️⃣ Vérification du healthcheck...');
    const healthResponse = await fetch(`${SCHEDULER_URL}/health`, {
      signal: AbortSignal.timeout(10000)
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('   ✅ Healthcheck OK');
      console.log(`   - Status: ${health.status}`);
      console.log(`   - Service: ${health.service}`);
      console.log(`   - Scheduler actif: ${health.schedulerActive ? '✅' : '❌'}`);
      console.log(`   - Mises à jour temps réel: ${health.realtimeUpdates ? '✅' : '❌'}`);
    } else {
      console.log(`   ❌ Healthcheck a répondu avec ${healthResponse.status}`);
    }

    // Vérifier le statut détaillé
    console.log('\n2️⃣ Récupération du statut détaillé...');
    const statusResponse = await fetch(`${SCHEDULER_URL}/status`, {
      signal: AbortSignal.timeout(10000)
    });
    
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log('   ✅ Statut récupéré');
      console.log(`   - Scheduler démarré: ${status.isStarted ? '✅' : '❌'}`);
      console.log(`   - Jobs actifs: ${status.activeJobs || 0}`);
      console.log(`   - Système réactif: ${status.reactiveSystem?.isStarted ? '✅' : '❌'}`);
      
      if (status.jobs && status.jobs.length > 0) {
        console.log(`\n   📋 Jobs planifiés (${status.jobs.length}):`);
        status.jobs.slice(0, 10).forEach((job, idx) => {
          console.log(`      ${idx + 1}. ${job.type || 'N/A'} - ${job.userId || 'N/A'}`);
        });
        if (status.jobs.length > 10) {
          console.log(`      ... et ${status.jobs.length - 10} autres`);
        }
      }
    } else {
      console.log(`   ❌ Statut a répondu avec ${statusResponse.status}`);
    }

    console.log('\n✅ Vérification terminée\n');

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`\n❌ Timeout lors de la connexion au scheduler`);
      console.error(`   Vérifiez que l'URL est correcte: ${SCHEDULER_URL}`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error(`\n❌ Impossible de se connecter au scheduler`);
      console.error(`   URL: ${SCHEDULER_URL}`);
      console.error(`   Vérifiez que SCHEDULER_URL est correct dans votre .env`);
    } else {
      console.error(`\n❌ Erreur:`, error.message);
    }
    process.exit(1);
  }
}

checkSchedulerStatus();
