#!/usr/bin/env node

/**
 * Vérifie si l'attribution (ref / affilié) est bien enregistrée pour un utilisateur.
 * Usage: node scripts/check-attribution.js [email]
 * Exemple: node scripts/check-attribution.js noah.l@free.fr
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

async function checkAttribution(email = 'noah.l@free.fr') {
  try {
    console.log('🔍 Vérification attribution pour:', email, '\n');

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        referredBy: true,
        attributionSource: true,
        attributionProvider: true,
        attributedAt: true,
        attributionData: true,
      },
    });

    if (!user) {
      console.error('❌ Aucun utilisateur trouvé avec cet email.');
      process.exit(1);
    }

    console.log('─'.repeat(60));
    console.log('👤 User:', user.email, '| id:', user.id);
    console.log('   Créé le:', user.createdAt?.toLocaleString('fr-FR'));
    console.log('─'.repeat(60));
    console.log('📊 Attribution:');
    console.log('   referredBy         :', user.referredBy ?? '(vide)');
    console.log('   attributionSource  :', user.attributionSource ?? '(vide)');
    console.log('   attributionProvider:', user.attributionProvider ?? '(vide)');
    console.log('   attributedAt       :', user.attributedAt ? user.attributedAt.toLocaleString('fr-FR') : '(vide)');
    if (user.attributionData) {
      console.log('   attributionData     :', JSON.stringify(user.attributionData, null, 2));
    } else {
      console.log('   attributionData     : (vide)');
    }
    console.log('─'.repeat(60));

    const hasAttribution = user.referredBy || user.attributionSource || user.attributedAt;
    if (hasAttribution) {
      console.log('\n✅ Attribution enregistrée côté backend.');
    } else {
      console.log('\n⚠️  Aucune attribution en base pour ce user.');
      console.log('   → L’app n’a peut-être pas appelé POST /api/user/attribution (conversion data pas encore reçue, ou build sans le code).');
    }
    console.log('');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2] || 'noah.l@free.fr';
checkAttribution(email);
