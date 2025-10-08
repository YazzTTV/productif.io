**📋 Contexte existant**

Vous disposez déjà de :

-   ✅ Modèle TimeEntry avec gestion des temps

-   ✅ API /api/time-entries/route.ts pour CRUD

-   ✅ Relations Task/Project sur les TimeEntry

**Stratégie** : Utiliser TimeEntry comme base et ajouter uniquement un
modèle léger DeepWorkSession pour les métadonnées spécifiques au Deep
Work.

**🎯 Objectif de la feature**

Permettre à l\'utilisateur de :

1.  Dire \"je commence à travailler\" via WhatsApp

2.  L\'IA demande la durée souhaitée

3.  Lancer automatiquement un timer + créer une TimeEntry

4.  Recevoir notification 5min avant la fin

5.  Terminer automatiquement à la fin prévue

6.  Possibilité de terminer manuellement

**Phase 1 : Modèle de données (ADAPTATION)**

**1.1 Créer le modèle DeepWorkSession**

**Fichier** : prisma/schema.prisma

**Action** : Ajouter le modèle suivant après le modèle TimeEntry

prisma

model DeepWorkSession {

id String \@id \@default(cuid())

userId String

user User \@relation(fields: \[userId\], references: \[id\], onDelete:
Cascade)

timeEntryId String \@unique

timeEntry TimeEntry \@relation(fields: \[timeEntryId\], references:
\[id\], onDelete: Cascade)

plannedDuration Int // en minutes

status String \@default(\"active\") // active, paused, completed,
cancelled

type String \@default(\"deepwork\") // deepwork, focus, pomodoro

interruptions Int \@default(0)

notes String?

createdAt DateTime \@default(now())

updatedAt DateTime \@updatedAt

@@index(\[userId, status\])

@@index(\[userId, createdAt\])

}

**Important** : Ajouter la relation inverse dans le modèle TimeEntry

prisma

model TimeEntry {

// \... champs existants

deepWorkSession DeepWorkSession?

// \... reste du modèle

}

**1.2 Migration**

bash

npx prisma migrate dev \--name add_deepwork_sessions

npx prisma generate

**Phase 2 : API Backend**

**2.1 Créer l\'endpoint principal**

**Fichier** : app/api/deepwork/agent/route.ts

**Action** : Créer le fichier avec le contenu suivant

typescript

import { NextRequest, NextResponse } from \'next/server\';

import { verifyApiToken } from \'@/middleware/api-auth\';

import prisma from \'@/lib/prisma\';

*// POST : Démarrer une session Deep Work*

export async function POST(req: NextRequest) {

try {

const verification = await verifyApiToken(req, \[\'deepwork:write\',
\'tasks:write\'\]);

if (!verification.valid) {

return NextResponse.json({ error: verification.error }, { status: 401
});

}

const { plannedDuration, type = \'deepwork\', description } = await
req.json();

const userId = verification.payload.userId;

*// Validation*

if (!plannedDuration \|\| plannedDuration \< 1) {

return NextResponse.json({

error: \'plannedDuration requis (en minutes)\'

}, { status: 400 });

}

*// Vérifier qu\'il n\'y a pas déjà une session active*

const activeSession = await prisma.deepWorkSession.findFirst({

where: {

userId,

status: \'active\'

},

include: {

timeEntry: true

}

});

if (activeSession) {

const elapsed = Math.floor(

(new Date().getTime() - activeSession.timeEntry.startTime.getTime()) /
60000

);

return NextResponse.json({

error: \'Une session est déjà en cours\',

session: {

\...activeSession,

elapsedMinutes: elapsed

}

}, { status: 400 });

}

*// Créer d\'abord la TimeEntry*

const startTime = new Date();

const timeEntry = await prisma.timeEntry.create({

data: {

userId,

startTime,

description: description \|\| \`Session Deep Work
(\${plannedDuration}min)\`,

}

});

*// Créer la DeepWorkSession liée*

const session = await prisma.deepWorkSession.create({

data: {

userId,

timeEntryId: timeEntry.id,

plannedDuration,

type,

status: \'active\'

},

include: {

timeEntry: true

}

});

const endTimeExpected = new Date(startTime.getTime() + plannedDuration
\* 60000);

return NextResponse.json({

session,

message: \`Session Deep Work lancée pour \${plannedDuration} minutes\`,

endTimeExpected: endTimeExpected.toISOString()

}, { status: 201 });

} catch (error) {

console.error(\'Erreur création session Deep Work:\', error);

return NextResponse.json({

error: \'Erreur serveur\',

details: error instanceof Error ? error.message : \'Unknown error\'

}, { status: 500 });

}

}

*// GET : Récupérer les sessions*

export async function GET(req: NextRequest) {

try {

const verification = await verifyApiToken(req, \[\'deepwork:read\',
\'tasks:read\'\]);

if (!verification.valid) {

return NextResponse.json({ error: verification.error }, { status: 401
});

}

const userId = verification.payload.userId;

const { searchParams } = new URL(req.url);

const status = searchParams.get(\'status\'); *// active, completed, all*

const limit = parseInt(searchParams.get(\'limit\') \|\| \'10\');

const where: any = { userId };

if (status && status !== \'all\') {

where.status = status;

}

const sessions = await prisma.deepWorkSession.findMany({

where,

include: {

timeEntry: {

include: {

task: true,

project: true

}

}

},

orderBy: { createdAt: \'desc\' },

take: limit

});

*// Enrichir avec durée écoulée pour les sessions actives*

const enrichedSessions = sessions.map(session =\> {

if (session.status === \'active\') {

const elapsed = Math.floor(

(new Date().getTime() - session.timeEntry.startTime.getTime()) / 60000

);

return { \...session, elapsedMinutes: elapsed };

}

return session;

});

return NextResponse.json({ sessions: enrichedSessions });

} catch (error) {

console.error(\'Erreur récupération sessions:\', error);

return NextResponse.json({ error: \'Erreur serveur\' }, { status: 500
});

}

}

**2.2 Créer l\'endpoint de gestion d\'une session**

**Fichier** : app/api/deepwork/agent/\[id\]/route.ts

**Action** : Créer le fichier avec le contenu suivant

typescript

import { NextRequest, NextResponse } from \'next/server\';

import { verifyApiToken } from \'@/middleware/api-auth\';

import prisma from \'@/lib/prisma\';

*// PATCH : Mettre à jour une session (pause, reprendre, terminer,
annuler)*

export async function PATCH(

req: NextRequest,

{ params }: { params: { id: string } }

) {

try {

const verification = await verifyApiToken(req, \[\'deepwork:write\',
\'tasks:write\'\]);

if (!verification.valid) {

return NextResponse.json({ error: verification.error }, { status: 401
});

}

const { action, notes } = await req.json();

const sessionId = params.id;

const userId = verification.payload.userId;

*// Récupérer la session*

const session = await prisma.deepWorkSession.findFirst({

where: {

id: sessionId,

userId

},

include: { timeEntry: true }

});

if (!session) {

return NextResponse.json({

error: \'Session non trouvée\'

}, { status: 404 });

}

const now = new Date();

let updateData: any = { updatedAt: now };

let timeEntryUpdate: any = {};

switch (action) {

case \'complete\':

const duration = Math.floor(

(now.getTime() - session.timeEntry.startTime.getTime()) / 60000

);

updateData = {

status: \'completed\',

notes

};

timeEntryUpdate = {

endTime: now

};

break;

case \'pause\':

if (session.status !== \'active\') {

return NextResponse.json({

error: \'La session n\\\'est pas active\'

}, { status: 400 });

}

updateData.status = \'paused\';

break;

case \'resume\':

if (session.status !== \'paused\') {

return NextResponse.json({

error: \'La session n\\\'est pas en pause\'

}, { status: 400 });

}

updateData.status = \'active\';

break;

case \'cancel\':

updateData.status = \'cancelled\';

*// Supprimer la TimeEntry associée*

await prisma.timeEntry.delete({

where: { id: session.timeEntry.id }

});

*// La DeepWorkSession sera supprimée en cascade*

return NextResponse.json({

message: \'Session annulée et supprimée\'

});

case \'add_interruption\':

updateData.interruptions = session.interruptions + 1;

break;

default:

return NextResponse.json({

error: \'Action non reconnue. Actions disponibles: complete, pause,
resume, cancel, add_interruption\'

}, { status: 400 });

}

*// Mettre à jour la session*

const updatedSession = await prisma.deepWorkSession.update({

where: { id: sessionId },

data: updateData,

include: { timeEntry: true }

});

*// Mettre à jour la TimeEntry si nécessaire*

if (Object.keys(timeEntryUpdate).length \> 0) {

await prisma.timeEntry.update({

where: { id: session.timeEntry.id },

data: timeEntryUpdate

});

}

*// Recalculer la durée si terminée*

let actualDuration = null;

if (action === \'complete\') {

actualDuration = Math.floor(

(now.getTime() - session.timeEntry.startTime.getTime()) / 60000

);

}

return NextResponse.json({

session: updatedSession,

actualDuration,

message: \`Session \${action === \'complete\' ? \'terminée\' : \'mise à
jour\'}\`

});

} catch (error) {

console.error(\'Erreur mise à jour session:\', error);

return NextResponse.json({

error: \'Erreur serveur\',

details: error instanceof Error ? error.message : \'Unknown error\'

}, { status: 500 });

}

}

*// GET : Récupérer une session spécifique*

export async function GET(

req: NextRequest,

{ params }: { params: { id: string } }

) {

try {

const verification = await verifyApiToken(req, \[\'deepwork:read\',
\'tasks:read\'\]);

if (!verification.valid) {

return NextResponse.json({ error: verification.error }, { status: 401
});

}

const sessionId = params.id;

const userId = verification.payload.userId;

const session = await prisma.deepWorkSession.findFirst({

where: {

id: sessionId,

userId

},

include: {

timeEntry: {

include: {

task: true,

project: true

}

}

}

});

if (!session) {

return NextResponse.json({

error: \'Session non trouvée\'

}, { status: 404 });

}

*// Enrichir avec durée écoulée si active*

if (session.status === \'active\') {

const elapsed = Math.floor(

(new Date().getTime() - session.timeEntry.startTime.getTime()) / 60000

);

return NextResponse.json({

session: { \...session, elapsedMinutes: elapsed }

});

}

return NextResponse.json({ session });

} catch (error) {

console.error(\'Erreur récupération session:\', error);

return NextResponse.json({ error: \'Erreur serveur\' }, { status: 500
});

}

}

**Phase 3 : Scheduler pour fin automatique**

**3.1 Créer le service DeepWorkScheduler**

**Fichier** : lib/deepwork/DeepWorkScheduler.ts

**Action** : Créer le fichier avec le contenu suivant

typescript

import prisma from \'@/lib/prisma\';

import { sendWhatsAppMessage } from \'@/lib/whatsapp\';

export class DeepWorkScheduler {

private checkInterval: NodeJS.Timeout \| null = null;

private readonly CHECK_FREQUENCY_MS = 2 \* 60 \* 1000; *// Vérifier
toutes les 2 minutes*

start() {

if (this.checkInterval) {

console.warn(\'DeepWorkScheduler déjà démarré\');

return;

}

this.checkInterval = setInterval(() =\> {

this.checkSessions().catch(error =\> {

console.error(\'Erreur dans checkSessions:\', error);

});

}, this.CHECK_FREQUENCY_MS);

console.log(\'✅ DeepWorkScheduler démarré (vérification toutes les
2min)\');

*// Faire une vérification immédiate au démarrage*

this.checkSessions().catch(console.error);

}

stop() {

if (this.checkInterval) {

clearInterval(this.checkInterval);

this.checkInterval = null;

console.log(\'⏹️ DeepWorkScheduler arrêté\');

}

}

private async checkSessions() {

try {

const now = new Date();

*// Récupérer toutes les sessions actives*

const activeSessions = await prisma.deepWorkSession.findMany({

where: {

status: \'active\'

},

include: {

user: {

select: {

id: true,

notificationPreferences: true

}

},

timeEntry: true

}

});

console.log(\`🔍 Vérification de \${activeSessions.length} session(s)
active(s)\`);

for (const session of activeSessions) {

const elapsed = Math.floor(

(now.getTime() - session.timeEntry.startTime.getTime()) / 60000

);

const remainingMinutes = session.plannedDuration - elapsed;

*// Si le temps planifié est dépassé : terminer automatiquement*

if (remainingMinutes \<= 0) {

console.log(\`⏰ Session \${session.id} terminée (\${elapsed}min
écoulées)\`);

await this.completeSession(session);

}

*// Rappel 5 minutes avant la fin*

else if (remainingMinutes \<= 5 && remainingMinutes \> 3) {

await this.sendReminder(session, remainingMinutes);

}

}

} catch (error) {

console.error(\'❌ Erreur vérification sessions Deep Work:\', error);

}

}

private async completeSession(session: any) {

try {

const now = new Date();

const duration = Math.floor(

(now.getTime() - session.timeEntry.startTime.getTime()) / 60000

);

*// Mettre à jour la session*

await prisma.deepWorkSession.update({

where: { id: session.id },

data: {

status: \'completed\'

}

});

*// Mettre à jour la TimeEntry*

await prisma.timeEntry.update({

where: { id: session.timeEntry.id },

data: {

endTime: now

}

});

console.log(\`✅ Session \${session.id} terminée automatiquement
(\${duration}min)\`);

*// Envoyer notification WhatsApp si configuré*

await this.sendCompletionNotification(session, duration);

} catch (error) {

console.error(\`❌ Erreur completion session \${session.id}:\`, error);

}

}

private async sendCompletionNotification(session: any, actualDuration:
number) {

try {

const prefs = session.user.notificationPreferences;

if (!prefs?.whatsappEnabled \|\| !prefs?.whatsappNumber) {

return;

}

const onTime = actualDuration \<= session.plannedDuration + 2; *//
Tolérance de 2min*

let message = \`✅ \*Session Deep Work terminée !\*\\n\\n\`;

message += \`⏱️ Durée prévue : \${session.plannedDuration} minutes\\n\`;

message += \`⏱️ Durée réelle : \${actualDuration} minutes\\n\\n\`;

if (onTime) {

message += \`🎉 Parfait ! Tu as respecté ton temps prévu !\\n\\n\`;

} else {

const overtime = actualDuration - session.plannedDuration;

message += \`⚠️ Tu as dépassé de \${overtime} minutes\\n\\n\`;

}

message += \`💪 Excellent travail de concentration ! Continue comme ça
!\`;

await sendWhatsAppMessage(prefs.whatsappNumber, message);

console.log(\`📱 Notification envoyée à \${session.user.id}\`);

} catch (error) {

console.error(\'❌ Erreur envoi notification completion:\', error);

}

}

private async sendReminder(session: any, minutesLeft: number) {

try {

const prefs = session.user.notificationPreferences;

if (!prefs?.whatsappEnabled \|\| !prefs?.whatsappNumber) {

return;

}

*// Vérifier qu\'on n\'a pas déjà envoyé un rappel récemment*

const lastReminderKey = \`reminder_sent\_\${session.id}\`;

*// Pour éviter les doublons, on pourrait stocker en Redis ou dans la
session*

*// Simplification : on envoie seulement si remainingMinutes === 5*

if (minutesLeft === 5) {

const message = \`⏰ \*Rappel Deep Work\*\\n\\nPlus que \${minutesLeft}
minutes sur ta session !\\n\\n🎯 Termine en beauté ! 💪\`;

await sendWhatsAppMessage(prefs.whatsappNumber, message);

console.log(\`📱 Rappel 5min envoyé à \${session.user.id}\`);

}

} catch (error) {

console.error(\'❌ Erreur envoi rappel:\', error);

}

}

}

*// Instance singleton*

export const deepWorkScheduler = new DeepWorkScheduler();

**3.2 Intégrer au scheduler principal**

**Fichier** : lib/ReactiveSchedulerManager.js (ou .ts)

**Action** : Ajouter l\'import et le démarrage

javascript

*// En haut du fichier*

import { deepWorkScheduler } from \'./deepwork/DeepWorkScheduler\';

*// Dans la méthode start()*

async start() {

*// \... code existant*

*// Démarrer le DeepWorkScheduler*

deepWorkScheduler.start();

*// \... reste du code*

}

*// Dans la méthode stop()*

async stop() {

*// \... code existant*

*// Arrêter le DeepWorkScheduler*

deepWorkScheduler.stop();

*// \... reste du code*

}

**Phase 4 : Handler WhatsApp conversationnel**

**4.1 Créer le handler Deep Work**

**Fichier** : lib/agent/handlers/deepwork.handler.ts

**Action** : Créer le fichier avec le contenu suivant

typescript

import { sendWhatsAppMessage } from \'@/lib/whatsapp\';

import prisma from \'@/lib/prisma\';

*// État conversationnel temporaire (à stocker en Redis en production)*

const userStates = new Map\<string, { state: string; data?: any }\>();

export async function handleDeepWorkCommand(

message: string,

userId: string,

phoneNumber: string,

apiToken: string

): Promise\<boolean\> {

const lowerMessage = message.toLowerCase();

*// Vérifier si l\'utilisateur est en attente de réponse*

const currentState = userStates.get(userId);

if (currentState?.state === \'awaiting_deepwork_duration\') {

return await processDurationResponse(message, userId, phoneNumber,
apiToken);

}

*// Commandes de démarrage*

if (

(lowerMessage.includes(\'commence\') \|\|
lowerMessage.includes(\'démarre\')) &&

(lowerMessage.includes(\'travailler\') \|\|
lowerMessage.includes(\'travail\') \|\| lowerMessage.includes(\'deep
work\'))

) {

return await startDeepWorkSession(userId, phoneNumber, apiToken);

}

*// Commandes de fin*

if (

(lowerMessage.includes(\'termine\') \|\| lowerMessage.includes(\'fini\')
\|\| lowerMessage.includes(\'stop\')) &&

(lowerMessage.includes(\'session\') \|\| lowerMessage.includes(\'deep
work\') \|\| lowerMessage.includes(\'travail\'))

) {

return await endDeepWorkSession(userId, phoneNumber, apiToken);

}

*// Statut de la session en cours*

if (

(lowerMessage.includes(\'session\') \|\| lowerMessage.includes(\'deep
work\')) &&

(lowerMessage.includes(\'en cours\') \|\|
lowerMessage.includes(\'active\') \|\|
lowerMessage.includes(\'statut\'))

) {

return await getActiveSession(userId, phoneNumber, apiToken);

}

*// Pause*

if (lowerMessage.includes(\'pause\') &&
(lowerMessage.includes(\'session\') \|\| lowerMessage.includes(\'deep
work\'))) {

return await pauseSession(userId, phoneNumber, apiToken);

}

*// Reprendre*

if (

(lowerMessage.includes(\'reprend\') \|\|
lowerMessage.includes(\'continue\') \|\|
lowerMessage.includes(\'reprise\')) &&

(lowerMessage.includes(\'session\') \|\| lowerMessage.includes(\'deep
work\'))

) {

return await resumeSession(userId, phoneNumber, apiToken);

}

*// Historique*

if (

(lowerMessage.includes(\'historique\') \|\|
lowerMessage.includes(\'sessions\')) &&

(lowerMessage.includes(\'deep work\') \|\|
lowerMessage.includes(\'travail\'))

) {

return await showHistory(userId, phoneNumber, apiToken);

}

return false; *// Pas une commande Deep Work*

}

async function startDeepWorkSession(

userId: string,

phoneNumber: string,

apiToken: string

): Promise\<boolean\> {

*// Vérifier qu\'il n\'y a pas déjà une session active*

const response = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=active\`,

{

headers: { \'Authorization\': \`Bearer \${apiToken}\` }

}

);

const { sessions } = await response.json();

if (sessions && sessions.length \> 0) {

const session = sessions\[0\];

await sendWhatsAppMessage(

phoneNumber,

\`⚠️ Tu as déjà une session en cours !\\n\\n⏱️ Temps écoulé :
\${session.elapsedMinutes}/\${session.plannedDuration}
minutes\\n\\nÉcris \"termine session\" pour la terminer ou \"pause
session\" pour faire une pause.\`

);

return true;

}

*// Demander la durée*

await sendWhatsAppMessage(

phoneNumber,

\`🚀 \*C\'est parti pour une session Deep Work !\*\\n\\nCombien de temps
veux-tu travailler ?\\n\\n💡 Choix rapides :\\n• 25 (Pomodoro)\\n• 50
(Session courte)\\n• 90 (Deep Work classique)\\n• 120 (Session
intensive)\\n\\nOu réponds avec n\'importe quel nombre de minutes !\`

);

*// Enregistrer l\'état*

userStates.set(userId, { state: \'awaiting_deepwork_duration\' });

return true;

}

async function processDurationResponse(

message: string,

userId: string,

phoneNumber: string,

apiToken: string

): Promise\<boolean\> {

*// Extraire le nombre de minutes*

const match = message.match(/(\\d+)/);

if (!match) {

await sendWhatsAppMessage(

phoneNumber,

\`🤔 Je n\'ai pas compris\... Réponds simplement avec un nombre de
minutes !\\n\\nExemples : 25, 90, 120\`

);

return true;

}

const duration = parseInt(match\[1\]);

*// Validation*

if (duration \< 5) {

await sendWhatsAppMessage(

phoneNumber,

\`⚠️ Minimum 5 minutes pour une session Deep Work !\\n\\nRéessaye avec
une durée plus longue.\`

);

return true;

}

if (duration \> 240) {

await sendWhatsAppMessage(

phoneNumber,

\`⚠️ Maximum 240 minutes (4h) !\\n\\nAu-delà, tu risques de perdre en
concentration. Réessaye avec une durée plus courte.\`

);

return true;

}

*// Appeler l\'API pour créer la session*

try {

const response = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent\`,

{

method: \'POST\',

headers: {

\'Authorization\': \`Bearer \${apiToken}\`,

\'Content-Type\': \'application/json\'

},

body: JSON.stringify({

plannedDuration: duration,

type: \'deepwork\'

})

}

);

if (response.ok) {

const { session, endTimeExpected } = await response.json();

const endTime = new Date(endTimeExpected);

await sendWhatsAppMessage(

phoneNumber,

\`✅ \*Session Deep Work lancée !\*\\n\\n⏱️ Durée : \${duration}
minutes\\n🎯 Fin prévue : \${endTime.toLocaleTimeString(\'fr-FR\', {
hour: \'2-digit\', minute: \'2-digit\' })}\\n\\n🔥 Reste concentré, tu
peux le faire ! 💪\\n\\n_Je te préviendrai 5 minutes avant la fin.\_\`

);

*// Nettoyer l\'état*

userStates.delete(userId);

} else {

const error = await response.json();

await sendWhatsAppMessage(

phoneNumber,

\`❌ Oups, impossible de lancer la session :\\n\${error.error \|\|
\'Erreur inconnue\'}\`

);

userStates.delete(userId);

}

} catch (error) {

console.error(\'Erreur création session Deep Work:\', error);

await sendWhatsAppMessage(

phoneNumber,

\`❌ Erreur technique. Réessaye dans quelques instants !\`

);

userStates.delete(userId);

}

return true;

}

async function endDeepWorkSession(

userId: string,

phoneNumber: string,

apiToken: string

): Promise\<boolean\> {

*// Récupérer la session active*

const response = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=active\`,

{

headers: { \'Authorization\': \`Bearer \${apiToken}\` }

}

);

const { sessions } = await response.json();

if (!sessions \|\| sessions.length === 0) {

await sendWhatsAppMessage(

phoneNumber,

\`ℹ️ Aucune session en cours.\\n\\nÉcris \"je commence à travailler\"
pour démarrer une nouvelle session !\`

);

return true;

}

const session = sessions\[0\];

*// Terminer la session*

const endResponse = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent/\${session.id}\`,

{

method: \'PATCH\',

headers: {

\'Authorization\': \`Bearer \${apiToken}\`,

\'Content-Type\': \'application/json\'

},

body: JSON.stringify({ action: \'complete\' })

}

);

if (endResponse.ok) {

const { actualDuration } = await endResponse.json();

const wasOnTime = actualDuration \<= session.plannedDuration + 2;

let message = \`✅ \*Session terminée !\*\\n\\n\`;

message += \`⏱️ Durée prévue : \${session.plannedDuration} min\\n\`;

message += \`⏱️ Durée réelle : \${actualDuration} min\\n\\n\`;

if (wasOnTime) {

message += \`🎉 Parfait ! Tu as tenu ton objectif !\\n\\n\`;

} else {

const diff = actualDuration - session.plannedDuration;

message += \`Tu as \${diff \> 0 ? \'dépassé de\' : \'terminé\'}
\${Math.abs(diff)} minutes \${diff \> 0 ? \'plus tôt\' : \'plus
tard\'}.\\n\\n\`;

}

message += \`💪 Bien joué ! Profite d\'une pause bien méritée !\`;

await sendWhatsAppMessage(phoneNumber, message);

} else {

await sendWhatsAppMessage(

phoneNumber,

\`❌ Erreur lors de la terminaison de la session.\`

);

}

return true;

}

async function getActiveSession(

userId: string,

phoneNumber: string,

apiToken: string

): Promise\<boolean\> {

const response = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=active\`,

{

headers: { \'Authorization\': \`Bearer \${apiToken}\` }

}

);

Retry

Claude does not have the ability to run the code it generates yet.

N

Continue

typescript

const { sessions } = await response.json();

if (!sessions \|\| sessions.length === 0) {

await sendWhatsAppMessage(

phoneNumber,

\`ℹ️ Aucune session en cours.\\n\\nÉcris \"je commence à travailler\"
pour démarrer une nouvelle session !\`

);

return true;

}

const session = sessions\[0\];

const remainingMinutes = session.plannedDuration -
session.elapsedMinutes;

const progressPercent = Math.round((session.elapsedMinutes /
session.plannedDuration) \* 100);

let message = \`⏱️ \*Session Deep Work en cours\*\\n\\n\`;

message += \`🎯 Type : \${session.type}\\n\`;

message += \`⏳ Temps écoulé : \${session.elapsedMinutes} min\\n\`;

message += \`⏱️ Temps restant : \${remainingMinutes} min\\n\`;

message += \`📊 Progression : \${progressPercent}%\\n\\n\`;

if (remainingMinutes \> 0) {

message += \`💪 Continue, tu es sur la bonne voie !\`;

} else {

message += \`⚠️ Le temps est écoulé ! La session va se terminer
automatiquement.\`;

}

await sendWhatsAppMessage(phoneNumber, message);

return true;

}

async function pauseSession(

userId: string,

phoneNumber: string,

apiToken: string

): Promise\<boolean\> {

*// Récupérer la session active*

const response = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=active\`,

{

headers: { \'Authorization\': \`Bearer \${apiToken}\` }

}

);

const { sessions } = await response.json();

if (!sessions \|\| sessions.length === 0) {

await sendWhatsAppMessage(

phoneNumber,

\`ℹ️ Aucune session active à mettre en pause.\`

);

return true;

}

const session = sessions\[0\];

*// Mettre en pause*

const pauseResponse = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent/\${session.id}\`,

{

method: \'PATCH\',

headers: {

\'Authorization\': \`Bearer \${apiToken}\`,

\'Content-Type\': \'application/json\'

},

body: JSON.stringify({ action: \'pause\' })

}

);

if (pauseResponse.ok) {

await sendWhatsAppMessage(

phoneNumber,

\`⏸️ \*Session mise en pause\*\\n\\n⏱️ Temps écoulé :
\${session.elapsedMinutes} min\\n\\nÉcris \"reprendre session\" quand tu
es prêt(e) à continuer !\`

);

} else {

await sendWhatsAppMessage(

phoneNumber,

\`❌ Impossible de mettre en pause la session.\`

);

}

return true;

}

async function resumeSession(

userId: string,

phoneNumber: string,

apiToken: string

): Promise\<boolean\> {

*// Récupérer la session en pause*

const response = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=paused\`,

{

headers: { \'Authorization\': \`Bearer \${apiToken}\` }

}

);

const { sessions } = await response.json();

if (!sessions \|\| sessions.length === 0) {

await sendWhatsAppMessage(

phoneNumber,

\`ℹ️ Aucune session en pause.\\n\\nTu veux démarrer une nouvelle session
?\`

);

return true;

}

const session = sessions\[0\];

*// Reprendre*

const resumeResponse = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent/\${session.id}\`,

{

method: \'PATCH\',

headers: {

\'Authorization\': \`Bearer \${apiToken}\`,

\'Content-Type\': \'application/json\'

},

body: JSON.stringify({ action: \'resume\' })

}

);

if (resumeResponse.ok) {

const remainingMinutes = session.plannedDuration -
session.elapsedMinutes;

await sendWhatsAppMessage(

phoneNumber,

\`▶️ \*Session reprise !\*\\n\\n⏱️ Temps restant : \${remainingMinutes}
min\\n\\n🔥 Allez, on y retourne ! 💪\`

);

} else {

await sendWhatsAppMessage(

phoneNumber,

\`❌ Impossible de reprendre la session.\`

);

}

return true;

}

async function showHistory(

userId: string,

phoneNumber: string,

apiToken: string

): Promise\<boolean\> {

const response = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/deepwork/agent?status=completed&limit=5\`,

{

headers: { \'Authorization\': \`Bearer \${apiToken}\` }

}

);

const { sessions } = await response.json();

if (!sessions \|\| sessions.length === 0) {

await sendWhatsAppMessage(

phoneNumber,

\`📊 Aucune session terminée pour le moment.\\n\\nCommence ta première
session Deep Work maintenant !\`

);

return true;

}

let message = \`📊 \*Tes 5 dernières sessions\*\\n\\n\`;

sessions.forEach((session: any, idx: number) =\> {

const date = new Date(session.timeEntry.startTime);

const dateStr = date.toLocaleDateString(\'fr-FR\', {

day: \'numeric\',

month: \'short\'

});

const timeStr = date.toLocaleTimeString(\'fr-FR\', {

hour: \'2-digit\',

minute: \'2-digit\'

});

const actualDuration = Math.floor(

(new Date(session.timeEntry.endTime).getTime() - date.getTime()) / 60000

);

const wasOnTime = actualDuration \<= session.plannedDuration + 2;

const emoji = wasOnTime ? \'✅\' : \'⚠️\';

message += \`\${emoji} \*\${dateStr} à \${timeStr}\*\\n\`;

message += \` \${actualDuration}/\${session.plannedDuration} min\`;

if (session.interruptions \> 0) {

message += \` • \${session.interruptions} interruption(s)\`;

}

message += \`\\n\\n\`;

});

*// Calculer des stats globales*

const totalSessions = sessions.length;

const totalMinutes = sessions.reduce((sum: number, s: any) =\> {

if (s.timeEntry.endTime) {

return sum + Math.floor(

(new Date(s.timeEntry.endTime).getTime() - new
Date(s.timeEntry.startTime).getTime()) / 60000

);

}

return sum;

}, 0);

const avgMinutes = Math.round(totalMinutes / totalSessions);

message += \`📈 \*Stats :\* \${totalMinutes} min totales • Moyenne
\${avgMinutes} min/session\`;

await sendWhatsAppMessage(phoneNumber, message);

return true;

}

**4.2 Intégrer le handler dans le routeur WhatsApp**

**Fichier** : app/api/webhooks/whatsapp/route.ts (ou votre fichier de
webhook WhatsApp)

**Action** : Ajouter l\'import et l\'appel au handler

typescript

*// En haut du fichier*

import { handleDeepWorkCommand } from
\'@/lib/agent/handlers/deepwork.handler\';

*// Dans la fonction de traitement des messages (après
authentification)*

export async function POST(req: Request) {

*// \... code d\'authentification et extraction du message*

const messageType = message.type; *// text, audio, etc.*

const messageText = message.text?.body \|\| \'\';

*// Vérifier token API de l\'utilisateur*

const apiToken = await getOrCreateApiToken(userId); *// Votre logique
existante*

if (messageType === \'text\') {

*// Handler Deep Work*

const deepWorkHandled = await handleDeepWorkCommand(

messageText,

userId,

phoneNumber,

apiToken

);

if (deepWorkHandled) {

return new NextResponse(\'OK\', { status: 200 });

}

*// \... autres handlers (tâches, habitudes, etc.)*

}

*// \... reste du code*

}

**Phase 5 : Scopes et permissions**

**5.1 Ajouter les scopes Deep Work**

**Fichier** : middleware/api-auth.ts (ou votre fichier de gestion des
scopes)

**Action** : Ajouter les scopes dans la liste des scopes disponibles

typescript

export const AVAILABLE_SCOPES = \[

*// \... scopes existants (tasks:read, tasks:write, etc.)*

\'deepwork:read\',

\'deepwork:write\'

\];

**5.2 Mettre à jour l\'UI de génération de tokens**

**Fichier** : components/onboarding/AIAgentSetup.tsx (ou équivalent)

**Action** : Ajouter les scopes Deep Work aux scopes par défaut

typescript

const DEFAULT_SCOPES = \[

\'tasks:read\',

\'tasks:write\',

\'habits:read\',

\'habits:write\',

\'objectives:read\',

\'objectives:write\',

\'processes:read\',

\'processes:write\',

\'projects:read\',

\'deepwork:read\', *// ← NOUVEAU*

\'deepwork:write\' *// ← NOUVEAU*

\];

**Phase 6 : Tests et validation**

**6.1 Tests API (via Postman ou curl)**

**Test 1 : Démarrer une session**

bash

curl -X POST http://localhost:3000/api/deepwork/agent \\

-H \"Authorization: Bearer YOUR_API_TOKEN\" \\

-H \"Content-Type: application/json\" \\

-d \'{\"plannedDuration\": 90, \"type\": \"deepwork\"}\'

**Résultat attendu** : Status 201 avec objet session contenant id,
timeEntryId, plannedDuration

**Test 2 : Récupérer les sessions actives**

bash

curl -X GET \"http://localhost:3000/api/deepwork/agent?status=active\"
\\

-H \"Authorization: Bearer YOUR_API_TOKEN\"

**Résultat attendu** : Liste des sessions avec elapsedMinutes calculé

**Test 3 : Terminer une session**

bash

curl -X PATCH http://localhost:3000/api/deepwork/agent/SESSION_ID \\

-H \"Authorization: Bearer YOUR_API_TOKEN\" \\

-H \"Content-Type: application/json\" \\

-d \'{\"action\": \"complete\"}\'

**Résultat attendu** : Session avec status \"completed\" et TimeEntry
avec endTime rempli

**6.2 Tests WhatsApp**

**Scénario 1 : Flux complet**

1.  Envoyer : \"je commence à travailler\"

2.  L\'IA demande la durée

3.  Répondre : \"90\"

4.  Vérifier notification de démarrage

5.  Attendre 5min avant la fin → vérifier rappel

6.  Vérifier notification de fin automatique

**Scénario 2 : Terminaison manuelle**

1.  Démarrer une session

2.  Envoyer : \"termine session\"

3.  Vérifier message de confirmation avec durée réelle

**Scénario 3 : Pause/Reprise**

1.  Démarrer une session

2.  Envoyer : \"pause session\"

3.  Vérifier message de pause

4.  Envoyer : \"reprendre session\"

5.  Vérifier message de reprise

**Scénario 4 : Statut**

1.  Avoir une session en cours

2.  Envoyer : \"session en cours\"

3.  Vérifier affichage du temps écoulé et restant

**Scénario 5 : Historique**

1.  Avoir plusieurs sessions terminées

2.  Envoyer : \"historique deep work\"

3.  Vérifier affichage des 5 dernières sessions avec stats

**6.3 Tests Scheduler**

**Test automatique** :

1.  Créer une session avec plannedDuration: 3 (3 minutes)

2.  Attendre 5 minutes

3.  Vérifier que la session est passée à status \"completed\"

4.  Vérifier que la TimeEntry a un endTime

**Logs à surveiller** :

✅ DeepWorkScheduler démarré (vérification toutes les 2min)

🔍 Vérification de X session(s) active(s)

⏰ Session xxx terminée (Ymin écoulées)

✅ Session xxx terminée automatiquement (Ymin)

📱 Notification envoyée à USER_ID

**Phase 7 : Documentation utilisateur**

**7.1 Commandes WhatsApp disponibles**

Créer ou mettre à jour la documentation utilisateur avec :

**Démarrer une session :**

-   \"je commence à travailler\"

-   \"démarre deep work\"

-   \"je démarre une session\"

**Gérer une session :**

-   \"termine session\" → terminer manuellement

-   \"pause session\" → mettre en pause

-   \"reprendre session\" → reprendre après pause

-   \"session en cours\" → voir le statut

-   \"historique deep work\" → voir les 5 dernières sessions

**Durées recommandées :**

-   25 min → Pomodoro

-   50 min → Session courte

-   90 min → Deep Work classique

-   120 min → Session intensive

**Checklist de déploiement**

**Avant le déploiement**

-   Migration Prisma effectuée : npx prisma migrate deploy

-   Génération des types : npx prisma generate

-   Variables d\'environnement configurées (WHATSAPP\_\*,
    NEXT_PUBLIC_APP_URL)

-   Tests API passés (Postman/curl)

-   Tests WhatsApp en environnement de dev passés

-   Logs vérifiés (pas d\'erreurs dans la console)

**Après le déploiement**

-   Vérifier que le DeepWorkScheduler démarre (logs Railway/serveur)

-   Créer une session de test en production

-   Vérifier les notifications WhatsApp

-   Vérifier la fin automatique d\'une session courte (5-10min)

-   Tester les commandes WhatsApp en production

-   Monitorer les logs pour détecter des erreurs

**Monitoring**

**Métriques à surveiller :**

-   Nombre de sessions créées par jour

-   Taux de completion (complétées vs annulées)

-   Durée moyenne des sessions

-   Nombre d\'interruptions moyenne

-   Taux de respect du temps planifié

**Logs critiques :**

-   Erreurs de création de session

-   Erreurs de notification WhatsApp

-   Erreurs du scheduler

-   Sessions \"bloquées\" (actives depuis \> 4h)

**Optimisations futures (optionnelles)**

**V2 : Améliorer le système d\'état conversationnel**

**Problème actuel** : États stockés en mémoire (Map JavaScript) → perdu
au redémarrage

**Solution** : Utiliser Redis ou la base de données

**Modèle Prisma** :

prisma

model UserConversationState {

id String \@id \@default(cuid())

userId String \@unique

user User \@relation(fields: \[userId\], references: \[id\], onDelete:
Cascade)

state String // awaiting_deepwork_duration, awaiting_checkin_mood, etc.

data Json? // Données contextuelles

expiresAt DateTime?

createdAt DateTime \@default(now())

updatedAt DateTime \@updatedAt

}

**V3 : Ajouter des statistiques dans le dashboard web**

**Composant** : components/deepwork/DeepWorkStats.tsx

Afficher :

-   Nombre de sessions cette semaine

-   Temps total de Deep Work

-   Graphique des sessions par jour

-   Taux de réussite (respect du temps planifié)

-   Meilleurs créneaux horaires

**V4 : Intégration avec les tâches**

Permettre de lier une session Deep Work à une tâche spécifique :

-   L\'utilisateur peut dire \"je travaille sur X\"

-   L\'IA identifie la tâche et la lie à la session

-   Mise à jour automatique de la progression de la tâche

**V5 : Mode \"Flow State\"**

Détecter quand l\'utilisateur est en état de flow et ajuster
automatiquement :

-   Prolonger la session si très productive

-   Bloquer les notifications non-critiques

-   Analyse de productivité post-session

**Support et debugging**

**Problèmes fréquents**

**Problème : Les sessions ne se terminent pas automatiquement**

-   Vérifier que le DeepWorkScheduler est démarré (logs)

-   Vérifier l\'interval de vérification (2 minutes)

-   Vérifier les timestamps dans la base de données

**Problème : Les notifications WhatsApp ne partent pas**

-   Vérifier notificationPreferences.whatsappEnabled

-   Vérifier que whatsappNumber est rempli

-   Vérifier les credentials WhatsApp (token, phone number ID)

-   Vérifier les logs de sendWhatsAppMessage

**Problème : L\'IA ne comprend pas les commandes**

-   Vérifier l\'ordre des handlers (Deep Work doit être appelé avant les
    autres)

-   Ajouter des logs dans handleDeepWorkCommand pour debug

-   Tester avec les phrases exactes de la documentation

**Problème : Erreur 401 Unauthorized**

-   Vérifier que le token API a les bons scopes (deepwork:read,
    deepwork:write)

-   Vérifier que le token n\'est pas expiré

-   Régénérer un nouveau token si nécessaire

**Ressources**

**Prisma :**

-   Documentation :
    [[https://www.prisma.io/docs]{.underline}](https://www.prisma.io/docs)

-   Relations :
    [[https://www.prisma.io/docs/concepts/components/prisma-schema/relations]{.underline}](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)

**WhatsApp Cloud API :**

-   Documentation :
    [[https://developers.facebook.com/docs/whatsapp/cloud-api]{.underline}](https://developers.facebook.com/docs/whatsapp/cloud-api)

-   Envoyer des messages :
    [[https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages]{.underline}](https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages)

**Next.js API Routes :**

-   Documentation :
    [[https://nextjs.org/docs/app/building-your-application/routing/route-handlers]{.underline}](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

**Contact et feedback**

Pour toute question ou amélioration de cette feature :

1.  Consulter les logs du scheduler

2.  Vérifier la base de données (tables DeepWorkSession et TimeEntry)

3.  Tester en local avec les commandes WhatsApp

4.  Documenter les bugs trouvés avec reproductions steps

**FIN DU PLAN D\'ACTION FEATURE 1 : SESSIONS DEEP WORK**

Ce document est prêt à être utilisé par une IA pour implémenter la
fonctionnalité complète. Chaque section est détaillée avec le code exact
à créer/modifier et les validations à effectuer.

Retry

Claude does not have the ability to run the code it generates yet.

N
