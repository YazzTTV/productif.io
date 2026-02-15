#!/usr/bin/env node

/**
 * Script pour supprimer un ou plusieurs comptes utilisateur par nom ou email
 *
 * Usage:
 *   node scripts/delete-user-by-name-or-email.js                    # Cherche "théophile" ou "theophile"
 *   node scripts/delete-user-by-name-or-email.js --email "x@y.com"  # Par email exact
 *   node scripts/delete-user-by-name-or-email.js --name "théophile"  # Par nom (contient, insensible casse)
 *   node scripts/delete-user-by-name-or-email.js --name "théophile" --force
 *   node scripts/delete-user-by-name-or-email.js --dry-run           # Affiche sans supprimer
 *
 * Options:
 *   --email "email"  : Email exact à supprimer
 *   --name "nom"     : Nom partiel (contient, insensible à la casse)
 *   --force          : Supprime sans demander de confirmation
 *   --dry-run        : Affiche les comptes trouvés sans les supprimer
 *
 * Par défaut (sans --email ni --name): cherche les comptes dont le nom contient "théophile" ou "theophile"
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import readline from 'readline';

config();

const prisma = new PrismaClient();

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function askConfirmation(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(
        ['oui', 'o', 'y', 'yes'].includes(answer.toLowerCase().trim())
      );
    });
  });
}

async function deleteUserCompletely(userId) {
  const order = [
    // 1. LeaderboardGroup créés par l'utilisateur (invitations, members, puis group)
    async () => {
      const groups = await prisma.leaderboardGroup.findMany({
        where: { createdBy: userId },
        select: { id: true },
      });
      for (const g of groups) {
        await prisma.leaderboardGroupInvitation.deleteMany({
          where: { groupId: g.id },
        });
        await prisma.leaderboardGroupMember.deleteMany({
          where: { groupId: g.id },
        });
      }
      await prisma.leaderboardGroup.deleteMany({
        where: { createdBy: userId },
      });
    },
    // 2. Invitations créées par l'utilisateur (vers d'autres groupes)
    () =>
      prisma.leaderboardGroupInvitation.deleteMany({
        where: { invitedBy: userId },
      }),
    // 3. Missions et objectifs
    async () => {
      const missions = await prisma.mission.findMany({
        where: { userId },
        include: { objectives: { include: { actions: true } } },
      });
      for (const m of missions) {
        for (const o of m.objectives) {
          for (const a of o.actions) {
            await prisma.initiative.deleteMany({
              where: { objectiveActionId: a.id },
            });
          }
          await prisma.objectiveAction.deleteMany({
            where: { objectiveId: o.id },
          });
        }
        await prisma.objective.deleteMany({
          where: { missionId: m.id },
        });
      }
      await prisma.mission.deleteMany({ where: { userId } });
    },
    // 4. Projets (tâches, timeEntries, warMapEvents liés)
    async () => {
      const projects = await prisma.project.findMany({
        where: { userId },
        select: { id: true },
      });
      const projectIds = projects.map((p) => p.id);
      if (projectIds.length > 0) {
        await prisma.scheduledTaskEvent.deleteMany({ where: { userId } });
        await prisma.timeEntry.deleteMany({
          where: { projectId: { in: projectIds } },
        });
        await prisma.warMapEvent.deleteMany({
          where: { projectId: { in: projectIds } },
        });
        await prisma.task.deleteMany({
          where: { projectId: { in: projectIds } },
        });
      }
      await prisma.project.deleteMany({ where: { userId } });
    },
    // 5. Habitudes (et habit_entries en cascade)
    () => prisma.habit.deleteMany({ where: { userId } }),
    // 6. Gamification
    () => prisma.userGamification.deleteMany({ where: { userId } }),
    // 7. StreakHistory
    () => prisma.streakHistory.deleteMany({ where: { userId } }),
    // 8. UserAchievement
    () => prisma.userAchievement.deleteMany({ where: { userId } }),
    // 9. Journal et DailyInsight
    () => prisma.journalEntry.deleteMany({ where: { userId } }),
    () => prisma.dailyInsight.deleteMany({ where: { userId } }),
    // 10. Utilisateur (cascade gère Session, Task, TimeEntry, etc.)
    () => prisma.user.delete({ where: { id: userId } }),
  ];

  for (const fn of order) {
    await fn();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find((a) => a.startsWith('--email='));
  const nameArg = args.find((a) => a.startsWith('--name='));
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');

  let where = {};

  if (emailArg) {
    const email = emailArg.split('=')[1]?.trim();
    if (!email) {
      console.error('❌ --email= doit être suivi d\'un email');
      process.exit(1);
    }
    where = { email };
  } else if (nameArg) {
    const name = nameArg.split('=')[1]?.trim();
    if (!name) {
      console.error('❌ --name= doit être suivi d\'un nom');
      process.exit(1);
    }
    where = {
      name: {
        contains: name,
        mode: 'insensitive',
      },
    };
  } else {
    // Défaut: théophile
    where = {
      OR: [
        {
          name: {
            contains: 'théophile',
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: 'theophile',
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  const rl = createReadlineInterface();

  try {
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managedCompanyId: true,
        createdAt: true,
      },
    });

    if (users.length === 0) {
      console.log('❌ Aucun compte trouvé correspondant aux critères.');
      return;
    }

    // Exclure les admins et admins d'entreprise
    const protectedUsers = users.filter(
      (u) =>
        u.role === 'SUPER_ADMIN' ||
        u.role === 'ADMIN' ||
        u.managedCompanyId !== null
    );
    const toDelete = users.filter(
      (u) =>
        u.role !== 'SUPER_ADMIN' &&
        u.role !== 'ADMIN' &&
        u.managedCompanyId === null
    );

    console.log('\n📋 Comptes trouvés:\n');
    console.log('═'.repeat(80));

    toDelete.forEach((u, i) => {
      console.log(`\n${i + 1}. ${u.name || 'Sans nom'}`);
      console.log(`   📧 ${u.email}`);
      console.log(`   🆔 ${u.id}`);
      console.log(`   📅 Créé: ${u.createdAt?.toLocaleString('fr-FR')}`);
    });

    if (protectedUsers.length > 0) {
      console.log('\n\n⚠️  Comptes protégés (non supprimés):');
      protectedUsers.forEach((u) => {
        console.log(`   - ${u.name || 'Sans nom'} (${u.email}) [${u.role}]`);
      });
    }

    if (toDelete.length === 0) {
      console.log('\n❌ Aucun compte à supprimer (tous sont protégés).');
      return;
    }

    if (dryRun) {
      console.log(
        `\n🔍 [DRY-RUN] ${toDelete.length} compte(s) seraient supprimés. Aucune modification effectuée.`
      );
      return;
    }

    if (!force) {
      console.log('\n⚠️  Cette action est irréversible !');
      const ok = await askConfirmation(
        rl,
        `\nSupprimer ${toDelete.length} compte(s) ? (oui/non): `
      );
      if (!ok) {
        console.log('\n❌ Annulé.');
        return;
      }
    }

    console.log('\n🗑️  Suppression en cours...\n');
    const errors = [];

    for (const user of toDelete) {
      try {
        await deleteUserCompletely(user.id);
        console.log(`✅ Supprimé: ${user.email} (${user.name || 'Sans nom'})`);
      } catch (err) {
        errors.push({ user, error: err.message });
        console.error(`❌ Erreur pour ${user.email}: ${err.message}`);
      }
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`\n📊 Résumé: ${toDelete.length - errors.length} supprimé(s), ${errors.length} erreur(s)`);
    if (errors.length > 0) {
      errors.forEach(({ user, error }) =>
        console.log(`   - ${user.email}: ${error}`)
      );
    }
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main();
