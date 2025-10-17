**📝 Feature 2 : Journaling vocal avec analyse**

**Objectif**

Permettre l\'envoi de notes vocales en fin de journée pour documenter la
journée, puis générer des suggestions d\'amélioration le lendemain
matin.

**Étapes d\'implémentation**

**Phase 1 : Modèle de données**

**1.1 Créer le modèle JournalEntry**

prisma

// schema.prisma

model JournalEntry {

id String \@id \@default(cuid())

userId String

user User \@relation(fields: \[userId\], references: \[id\])

date DateTime \@default(now()) // Date de la journée concernée

// Contenu

audioUrl String? // URL du fichier audio stocké

transcription String? \@db.Text // Transcription du vocal

// Analyse IA

sentiment String? // positive, neutral, negative

themes Json? // { \"productivité\": 8, \"stress\": 3, \"motivation\": 7
}

highlights String\[\] // Ce qui a été aimé

improvements String\[\] // Ce qui pourrait être amélioré

// Métadonnées

processed Boolean \@default(false)

processingError String?

createdAt DateTime \@default(now())

updatedAt DateTime \@updatedAt

@@index(\[userId, date\])

@@unique(\[userId, date\]) // Une seule entrée par jour

}

model DailyInsight {

id String \@id \@default(cuid())

userId String

user User \@relation(fields: \[userId\], references: \[id\])

date DateTime \@default(now())

// Recommandations générées

recommendations String\[\] // \[\"Prends plus de pauses\", \"Commence
plus tôt\", etc.\]

focusAreas String\[\] // Domaines à améliorer

// Basé sur les X derniers jours

basedOnDays Int \@default(7)

journalEntries String\[\] // IDs des JournalEntry utilisés

sent Boolean \@default(false)

sentAt DateTime?

createdAt DateTime \@default(now())

@@index(\[userId, date\])

@@unique(\[userId, date\])

}

**1.2 Migration**

bash

npx prisma migrate dev \--name add_journaling

**Phase 2 : Gestion des fichiers audio**

**2.1 Configuration stockage (ex: S3, Cloudflare R2)**

typescript

*// lib/storage/audio.storage.ts*

import { S3Client, PutObjectCommand } from \'@aws-sdk/client-s3\';

import { getSignedUrl } from \'@aws-sdk/s3-request-presigner\';

const s3Client = new S3Client({

region: process.env.AWS_REGION!,

credentials: {

accessKeyId: process.env.AWS_ACCESS_KEY_ID!,

secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!

}

});

export async function uploadAudioFile(

userId: string,

audioBuffer: Buffer,

mimeType: string

): Promise\<string\> {

const fileName =
\`journals/\${userId}/\${Date.now()}.\${mimeType.split(\'/\')\[1\]}\`;

const command = new PutObjectCommand({

Bucket: process.env.AWS_S3_BUCKET!,

Key: fileName,

Body: audioBuffer,

ContentType: mimeType

});

await s3Client.send(command);

return
\`https://\${process.env.AWS_S3_BUCKET}.s3.\${process.env.AWS_REGION}.amazonaws.com/\${fileName}\`;

}

export async function getAudioDownloadUrl(audioUrl: string):
Promise\<string\> {

*// Génerer une URL signée si nécessaire*

return audioUrl;

}

**Phase 3 : Transcription audio**

**3.1 Service de transcription (OpenAI Whisper ou alternative)**

typescript

*// lib/ai/transcription.service.ts*

import OpenAI from \'openai\';

import fs from \'fs\';

import fetch from \'node-fetch\';

const openai = new OpenAI({

apiKey: process.env.OPENAI_API_KEY

});

export async function transcribeAudio(audioUrl: string):
Promise\<string\> {

try {

*// Télécharger le fichier audio temporairement*

const response = await fetch(audioUrl);

const buffer = await response.buffer();

*// Sauvegarder temporairement*

const tempPath = \`/tmp/audio-\${Date.now()}.ogg\`;

fs.writeFileSync(tempPath, buffer);

*// Transcrire avec Whisper*

const transcription = await openai.audio.transcriptions.create({

file: fs.createReadStream(tempPath),

model: \'whisper-1\',

language: \'fr\'

});

*// Nettoyer*

fs.unlinkSync(tempPath);

return transcription.text;

} catch (error) {

console.error(\'Erreur transcription:\', error);

throw error;

}

}

**Phase 4 : Analyse IA du journal**

**4.1 Service d\'analyse sémantique**

typescript

*// lib/ai/journal-analysis.service.ts*

import OpenAI from \'openai\';

const openai = new OpenAI({

apiKey: process.env.OPENAI_API_KEY

});

interface JournalAnalysis {

sentiment: \'positive\' \| \'neutral\' \| \'negative\';

themes: Record\<string, number\>; *// Score 0-10*

highlights: string\[\];

improvements: string\[\];

}

export async function analyzeJournalEntry(transcription: string):
Promise\<JournalAnalysis\> {

const prompt = \`Tu es un coach de productivité bienveillant. Analyse
cette entrée de journal quotidien et extrais :

1\. Le sentiment général (positive/neutral/negative)

2\. Les thèmes abordés avec leur intensité (0-10) : productivité,
stress, motivation, satisfaction, énergie, concentration, etc.

3\. Les points positifs (ce qui a été aimé ou bien fait)

4\. Les axes d\'amélioration (formulés de manière constructive)

Entrée de journal :

\"\"\"

\${transcription}

\"\"\"

Réponds UNIQUEMENT au format JSON suivant :

{

\"sentiment\": \"positive\|neutral\|negative\",

\"themes\": {

\"productivité\": 7,

\"stress\": 3,

\...

},

\"highlights\": \[\"point positif 1\", \"point positif 2\"\],

\"improvements\": \[\"amélioration 1\", \"amélioration 2\"\]

}\`;

const response = await openai.chat.completions.create({

model: \'gpt-4-turbo-preview\',

messages: \[

{

role: \'system\',

content: \'Tu es un assistant d\\\'analyse de productivité. Tu réponds
uniquement en JSON valide.\'

},

{ role: \'user\', content: prompt }

\],

temperature: 0.3,

response_format: { type: \'json_object\' }

});

const content = response.choices\[0\].message.content;

return JSON.parse(content!);

}

**4.2 Génération de recommandations quotidiennes**

typescript

*// lib/ai/daily-insights.service.ts*

export async function generateDailyInsights(

userId: string,

daysToAnalyze: number = 7

): Promise\<{ recommendations: string\[\]; focusAreas: string\[\] }\> {

*// Récupérer les derniers journals*

const journals = await prisma.journalEntry.findMany({

where: {

userId,

processed: true,

date: {

gte: new Date(Date.now() - daysToAnalyze \* 24 \* 60 \* 60 \* 1000)

}

},

orderBy: { date: \'desc\' }

});

if (journals.length === 0) {

return {

recommendations: \[\'Continue à noter tes journées pour recevoir des
recommandations personnalisées\'\],

focusAreas: \[\]

};

}

*// Construire un résumé*

const summary = journals.map((j, idx) =\>

\`Jour \${idx + 1} : \${j.highlights.join(\', \')} \| Améliorations :
\${j.improvements.join(\', \')}\`

).join(\'\\n\');

const prompt = \`En tant que coach productivité, analyse ces
\${journals.length} dernières entrées de journal et génère :

1\. 3-5 recommandations concrètes et actionnables pour améliorer la
productivité

2\. 2-3 domaines clés sur lesquels se concentrer

Historique :

\"\"\"

\${summary}

\"\"\"

Réponds au format JSON :

{

\"recommendations\": \[\"recommandation 1\", \"recommandation 2\",
\...\],

\"focusAreas\": \[\"domaine 1\", \"domaine 2\", \...\]

}\`;

const response = await openai.chat.completions.create({

model: \'gpt-4-turbo-preview\',

messages: \[

{ role: \'system\', content: \'Tu es un coach productivité expert.
Réponds en JSON.\' },

{ role: \'user\', content: prompt }

\],

temperature: 0.5,

response_format: { type: \'json_object\' }

});

return JSON.parse(response.choices\[0\].message.content!);

}

**Phase 5 : API Endpoints**

**5.1 Créer /app/api/journal/agent/route.ts**

typescript

import { NextRequest, NextResponse } from \'next/server\';

import { verifyApiToken } from \'@/middleware/api-auth\';

import { uploadAudioFile } from \'@/lib/storage/audio.storage\';

import { transcribeAudio } from \'@/lib/ai/transcription.service\';

import { analyzeJournalEntry } from
\'@/lib/ai/journal-analysis.service\';

import prisma from \'@/lib/prisma\';

*// POST : créer une entrée de journal avec audio*

export async function POST(req: NextRequest) {

const verification = await verifyApiToken(req, \[\'journal:write\'\]);

if (!verification.valid) {

return NextResponse.json({ error: verification.error }, { status: 401
});

}

try {

const formData = await req.formData();

const audioFile = formData.get(\'audio\') as File;

const date = formData.get(\'date\') as string \|\| new
Date().toISOString();

if (!audioFile) {

return NextResponse.json({ error: \'Fichier audio requis\' }, { status:
400 });

}

const userId = verification.payload.userId;

const journalDate = new Date(date);

journalDate.setHours(0, 0, 0, 0);

*// Upload audio*

const buffer = Buffer.from(await audioFile.arrayBuffer());

const audioUrl = await uploadAudioFile(userId, buffer, audioFile.type);

*// Créer l\'entrée (traitement asynchrone)*

const entry = await prisma.journalEntry.create({

data: {

userId,

date: journalDate,

audioUrl,

processed: false

}

});

*// Lancer le traitement en arrière-plan*

processJournalEntry(entry.id).catch(console.error);

return NextResponse.json({

entry,

message: \'Journal reçu ! Je vais l\\\'analyser et te donner mes
insights demain matin 🌅\'

});

} catch (error: any) {

console.error(\'Erreur création journal:\', error);

return NextResponse.json({ error: error.message }, { status: 500 });

}

}

*// GET : récupérer les entrées de journal*

export async function GET(req: NextRequest) {

const verification = await verifyApiToken(req, \[\'journal:read\'\]);

if (!verification.valid) {

return NextResponse.json({ error: verification.error }, { status: 401
});

}

const { searchParams } = new URL(req.url);

const days = parseInt(searchParams.get(\'days\') \|\| \'7\');

const userId = verification.payload.userId;

const entries = await prisma.journalEntry.findMany({

where: {

userId,

date: {

gte: new Date(Date.now() - days \* 24 \* 60 \* 60 \* 1000)

}

},

orderBy: { date: \'desc\' }

});

return NextResponse.json({ entries });

}

*// Fonction de traitement asynchrone*

async function processJournalEntry(entryId: string) {

try {

const entry = await prisma.journalEntry.findUnique({

where: { id: entryId }

});

if (!entry \|\| !

Retry

Claude does not have the ability to run the code it generates yet.

N

Continue

entry.audioUrl) return;

// 1. Transcription

console.log(\`Transcription du journal \${entryId}\...\`);

const transcription = await transcribeAudio(entry.audioUrl);

// 2. Analyse IA

console.log(\`Analyse du journal \${entryId}\...\`);

const analysis = await analyzeJournalEntry(transcription);

// 3. Mise à jour de l\'entrée

await prisma.journalEntry.update({

where: { id: entryId },

data: {

transcription,

sentiment: analysis.sentiment,

themes: analysis.themes,

highlights: analysis.highlights,

improvements: analysis.improvements,

processed: true

}

});

console.log(\`Journal \${entryId} traité avec succès\`);

} catch (error) { console.error(Erreur traitement journal \${entryId}:,
error); await prisma.journalEntry.update({ where: { id: entryId }, data:
{ processed: false, processingError: error instanceof Error ?
error.message : \'Erreur inconnue\' } }); } }

\*\*5.2 Créer \`/app/api/journal/insights/route.ts\`\*\*

\`\`\`typescript

// Générer ou récupérer les insights quotidiens

import { NextRequest, NextResponse } from \'next/server\';

import { verifyApiToken } from \'@/middleware/api-auth\';

import { generateDailyInsights } from
\'@/lib/ai/daily-insights.service\';

import prisma from \'@/lib/prisma\';

export async function GET(req: NextRequest) {

const verification = await verifyApiToken(req, \[\'journal:read\'\]);

if (!verification.valid) {

return NextResponse.json({ error: verification.error }, { status: 401
});

}

const { searchParams } = new URL(req.url);

const date = searchParams.get(\'date\') \|\| new Date().toISOString();

const userId = verification.payload.userId;

const insightDate = new Date(date);

insightDate.setHours(0, 0, 0, 0);

// Chercher insight existant

let insight = await prisma.dailyInsight.findUnique({

where: {

userId_date: {

userId,

date: insightDate

}

}

});

// Générer si pas trouvé

if (!insight) {

const { recommendations, focusAreas } = await
generateDailyInsights(userId, 7);

const recentJournals = await prisma.journalEntry.findMany({

where: {

userId,

processed: true,

date: { gte: new Date(Date.now() - 7 \* 24 \* 60 \* 60 \* 1000) }

},

select: { id: true }

});

insight = await prisma.dailyInsight.create({

data: {

userId,

date: insightDate,

recommendations,

focusAreas,

basedOnDays: 7,

journalEntries: recentJournals.map(j =\> j.id)

}

});

}

return NextResponse.json({ insight });

}

export async function POST(req: NextRequest) {

// Forcer la régénération

const verification = await verifyApiToken(req, \[\'journal:write\'\]);

if (!verification.valid) {

return NextResponse.json({ error: verification.error }, { status: 401
});

}

const userId = verification.payload.userId;

const today = new Date();

today.setHours(0, 0, 0, 0);

const { recommendations, focusAreas } = await
generateDailyInsights(userId, 7);

const recentJournals = await prisma.journalEntry.findMany({

where: {

userId,

processed: true,

date: { gte: new Date(Date.now() - 7 \* 24 \* 60 \* 60 \* 1000) }

},

select: { id: true }

});

const insight = await prisma.dailyInsight.upsert({

where: {

userId_date: { userId, date: today }

},

create: {

userId,

date: today,

recommendations,

focusAreas,

basedOnDays: 7,

journalEntries: recentJournals.map(j =\> j.id)

},

update: {

recommendations,

focusAreas,

journalEntries: recentJournals.map(j =\> j.id)

}

});

return NextResponse.json({ insight });

}

**Phase 6 : Handler WhatsApp pour les vocaux**

**6.1 Créer /lib/agent/handlers/journal.handler.ts**

typescript

import { sendWhatsAppMessage, downloadWhatsAppMedia } from
\'@/lib/whatsapp\';

import FormData from \'form-data\';

import fetch from \'node-fetch\';

export async function handleJournalVoiceNote(

audioId: string,

userId: string,

phoneNumber: string,

apiToken: string

) {

try {

*// 1. Télécharger le fichier audio depuis WhatsApp*

await sendWhatsAppMessage(

phoneNumber,

\'🎙️ J\\\'ai bien reçu ton vocal ! Je vais l\\\'analyser\... ⏳\'

);

const audioBuffer = await downloadWhatsAppMedia(audioId);

*// 2. Envoyer à l\'API journal*

const formData = new FormData();

formData.append(\'audio\', audioBuffer, {

filename: \'journal.ogg\',

contentType: \'audio/ogg\'

});

formData.append(\'date\', new Date().toISOString());

const response = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/journal/agent\`,

{

method: \'POST\',

headers: {

\'Authorization\': \`Bearer \${apiToken}\`

},

body: formData

}

);

if (response.ok) {

const { entry, message } = await response.json();

await sendWhatsAppMessage(phoneNumber, message);

} else {

throw new Error(\'Erreur enregistrement journal\');

}

return true;

} catch (error) {

console.error(\'Erreur traitement vocal journal:\', error);

await sendWhatsAppMessage(

phoneNumber,

\'❌ Oups, je n\\\'ai pas pu traiter ton vocal. Réessaye dans quelques
instants.\'

);

return true;

}

}

export async function handleJournalTextCommand(

message: string,

userId: string,

phoneNumber: string,

apiToken: string

) {

const lowerMessage = message.toLowerCase();

*// Commandes textuelles*

if (lowerMessage.includes(\'journal\') \|\|
lowerMessage.includes(\'journée\')) {

if (lowerMessage.includes(\'résumé\') \|\|
lowerMessage.includes(\'recap\')) {

return await sendJournalSummary(userId, phoneNumber, apiToken);

}

if (lowerMessage.includes(\'conseil\') \|\|
lowerMessage.includes(\'améliorer\')) {

return await sendDailyInsights(userId, phoneNumber, apiToken);

}

*// Instructions par défaut*

await sendWhatsAppMessage(

phoneNumber,

\'📔 \*\*Journal quotidien\*\*\\n\\n\' +

\'🎙️ Envoie-moi un vocal pour raconter ta journée\\n\' +

\'📊 Écris \"résumé journal\" pour voir tes dernières entrées\\n\' +

\'💡 Écris \"conseils du jour\" pour recevoir mes recommandations\'

);

return true;

}

return false;

}

async function sendJournalSummary(userId: string, phoneNumber: string,
apiToken: string) {

const response = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/journal/agent?days=7\`,

{

headers: { \'Authorization\': \`Bearer \${apiToken}\` }

}

);

const { entries } = await response.json();

if (!entries \|\| entries.length === 0) {

await sendWhatsAppMessage(

phoneNumber,

\'📔 Tu n\\\'as pas encore d\\\'entrées de journal.\\n\\nEnvoie-moi un
vocal ce soir pour commencer ! 🎙️\'

);

return true;

}

let message = \`📊 \*\*Tes 7 derniers jours\*\*\\n\\n\`;

entries.forEach((entry: any, idx: number) =\> {

const date = new Date(entry.date).toLocaleDateString(\'fr-FR\', {

weekday: \'short\',

day: \'numeric\',

month: \'short\'

});

const emoji = entry.sentiment === \'positive\' ? \'😊\' :

entry.sentiment === \'negative\' ? \'😔\' : \'😐\';

message += \`\${emoji} \*\*\${date}\*\*\\n\`;

if (entry.highlights?.length \> 0) {

message += \`✨ \${entry.highlights\[0\]}\\n\`;

}

message += \`\\n\`;

});

await sendWhatsAppMessage(phoneNumber, message);

return true;

}

async function sendDailyInsights(userId: string, phoneNumber: string,
apiToken: string) {

const response = await fetch(

\`\${process.env.NEXT_PUBLIC_APP_URL}/api/journal/insights\`,

{

headers: { \'Authorization\': \`Bearer \${apiToken}\` }

}

);

const { insight } = await response.json();

if (!insight \|\| insight.recommendations.length === 0) {

await sendWhatsAppMessage(

phoneNumber,

\'💡 Continue à noter tes journées pendant quelques jours, je pourrai
ensuite te donner des conseils personnalisés ! 📈\'

);

return true;

}

let message = \`🌅 \*\*Tes axes d\'amélioration\*\*\\n\\n\`;

if (insight.focusAreas.length \> 0) {

message += \`🎯 \*\*Concentre-toi sur :\*\*\\n\`;

insight.focusAreas.forEach((area: string) =\> {

message += \`• \${area}\\n\`;

});

message += \`\\n\`;

}

message += \`💡 \*\*Mes recommandations :\*\*\\n\`;

insight.recommendations.forEach((rec: string, idx: number) =\> {

message += \`\${idx + 1}. \${rec}\\n\`;

});

await sendWhatsAppMessage(phoneNumber, message);

return true;

}

**6.2 Intégration dans le routeur WhatsApp principal**

typescript

*// app/api/webhooks/whatsapp/route.ts*

import { handleJournalVoiceNote, handleJournalTextCommand } from
\'@/lib/agent/handlers/journal.handler\';

*// Dans le handler des messages*

if (messageType === \'audio\') {

const audioId = message.audio.id;

*// Vérifier si c\'est un journal (par contexte ou heure)*

const now = new Date();

const isEvening = now.getHours() \>= 18; *// Après 18h = journal
probable*

if (isEvening) {

await handleJournalVoiceNote(audioId, userId, phoneNumber, apiToken);

return new NextResponse(\'OK\', { status: 200 });

}

}

if (messageType === \'text\') {

const journalHandled = await handleJournalTextCommand(

messageText,

userId,

phoneNumber,

apiToken

);

if (journalHandled) return new NextResponse(\'OK\', { status: 200 });

*// \... autres handlers*

}

**Phase 7 : Scheduler pour envoi matinal**

**7.1 Créer /lib/journal/MorningInsightsScheduler.ts**

typescript

import cron from \'node-cron\';

import prisma from \'@/lib/prisma\';

import { sendWhatsAppMessage } from \'@/lib/whatsapp\';

export class MorningInsightsScheduler {

private cronJob: cron.ScheduledTask \| null = null;

start() {

*// Tous les jours à 7h00*

this.cronJob = cron.schedule(\'0 7 \* \* \*\', async () =\> {

await this.sendMorningInsights();

}, {

timezone: \'Europe/Paris\'

});

console.log(\'MorningInsightsScheduler démarré (7h00 quotidien)\');

}

stop() {

if (this.cronJob) {

this.cronJob.stop();

console.log(\'MorningInsightsScheduler arrêté\');

}

}

private async sendMorningInsights() {

try {

const today = new Date();

today.setHours(0, 0, 0, 0);

*// Récupérer tous les utilisateurs avec notification activée*

const users = await prisma.user.findMany({

where: {

notificationPreferences: {

notificationsEnabled: true,

whatsappEnabled: true,

whatsappNumber: { not: null }

}

},

include: {

notificationPreferences: true

}

});

for (const user of users) {

try {

*// Vérifier si l\'utilisateur a des entrées récentes*

const recentJournals = await prisma.journalEntry.count({

where: {

userId: user.id,

processed: true,

date: {

gte: new Date(Date.now() - 7 \* 24 \* 60 \* 60 \* 1000)

}

}

});

if (recentJournals === 0) continue; *// Skip si pas de journals*

*// Récupérer ou générer l\'insight du jour*

const insight = await this.getOrCreateInsight(user.id, today);

if (!insight.sent) {

await this.sendInsightToUser(user, insight);

*// Marquer comme envoyé*

await prisma.dailyInsight.update({

where: { id: insight.id },

data: { sent: true, sentAt: new Date() }

});

}

} catch (error) {

console.error(\`Erreur envoi insight pour user \${user.id}:\`, error);

}

}

} catch (error) {

console.error(\'Erreur sendMorningInsights:\', error);

}

}

private async getOrCreateInsight(userId: string, date: Date) {

let insight = await prisma.dailyInsight.findUnique({

where: {

userId_date: { userId, date }

}

});

if (!insight) {

*// Générer l\'insight*

const { generateDailyInsights } = await
import(\'@/lib/ai/daily-insights.service\');

const { recommendations, focusAreas } = await
generateDailyInsights(userId, 7);

const recentJournals = await prisma.journalEntry.findMany({

where: {

userId,

processed: true,

date: { gte: new Date(Date.now() - 7 \* 24 \* 60 \* 60 \* 1000) }

},

select: { id: true }

});

insight = await prisma.dailyInsight.create({

data: {

userId,

date,

recommendations,

focusAreas,

basedOnDays: 7,

journalEntries: recentJournals.map(j =\> j.id)

}

});

}

return insight;

}

private async sendInsightToUser(user: any, insight: any) {

const phoneNumber = user.notificationPreferences.whatsappNumber;

let message = \`🌅 \*\*Bonjour ! Voici tes insights du jour\*\*\\n\\n\`;

if (insight.focusAreas.length \> 0) {

message += \`🎯 \*\*Aujourd\'hui, concentre-toi sur :\*\*\\n\`;

insight.focusAreas.forEach((area: string) =\> {

message += \`• \${area}\\n\`;

});

message += \`\\n\`;

}

message += \`💡 \*\*Mes recommandations :\*\*\\n\`;

insight.recommendations.forEach((rec: string, idx: number) =\> {

message += \`\${idx + 1}. \${rec}\\n\`;

});

message += \`\\n✨ Bonne journée productive ! 💪\`;

await sendWhatsAppMessage(phoneNumber, message);

}

}

export const morningInsightsScheduler = new MorningInsightsScheduler();

**7.2 Intégrer au scheduler principal**

typescript

*// lib/ReactiveSchedulerManager.js*

import { morningInsightsScheduler } from
\'./journal/MorningInsightsScheduler\';

*// Dans start()*

morningInsightsScheduler.start();

*// Dans stop()*

morningInsightsScheduler.stop();

**Phase 8 : Scopes et permissions**

**8.1 Ajouter les scopes**

typescript

*// middleware/api-auth.ts*

export const AVAILABLE_SCOPES = \[

*// \... existants*

\'journal:read\',

\'journal:write\'

\];
