\## 🧠 Feature 3 : Analyse comportementale continue

\### Objectif

Poser des questions contextuelles tout au long de la journée pour
évaluer humeur, concentration et motivation, puis générer des insights.

\### Étapes d\'implémentation

\#### \*\*Phase 1 : Modèle de données\*\*

\*\*1.1 Créer les modèles de suivi comportemental\*\*

\`\`\`prisma

// schema.prisma

model BehaviorCheckIn {

id String \@id \@default(cuid())

userId String

user User \@relation(fields: \[userId\], references: \[id\])

timestamp DateTime \@default(now())

// Type de check-in

type String // mood, focus, motivation, energy, stress

// Réponse utilisateur

value Int // Score 1-10

note String? // Note optionnelle

context Json? // Contexte (activité en cours, etc.)

// Méthode de collecte

triggeredBy String // scheduled, manual, event-based

createdAt DateTime \@default(now())

@@index(\[userId, timestamp\])

@@index(\[userId, type, timestamp\])

}

model BehaviorPattern {

id String \@id \@default(cuid())

userId String

user User \@relation(fields: \[userId\], references: \[id\])

// Période analysée

startDate DateTime

endDate DateTime

// Patterns détectés

patterns Json // { \"morning_focus\": 8.5, \"afternoon_dip\": true, \...
}

// Moyennes par type

avgMood Float?

avgFocus Float?

avgMotivation Float?

avgEnergy Float?

avgStress Float?

// Insights générés

insights String\[\]

recommendations String\[\]

// Corrélations

correlations Json? // Ex: { \"focus_vs_sleep\": 0.7,
\"mood_vs_exercise\": 0.6 }

createdAt DateTime \@default(now())

updatedAt DateTime \@updatedAt

@@index(\[userId, startDate\])

}

model CheckInSchedule {

id String \@id \@default(cuid())

userId String

user User \@relation(fields: \[userId\], references: \[id\])

// Configuration

enabled Boolean \@default(true)

frequency String \@default(\"3x_daily\") // 3x_daily, hourly, custom

// Horaires personnalisés

schedules Json // \[{ time: \"09:00\", types: \[\"mood\", \"energy\"\]
}, \...\]

// Préférences

randomize Boolean \@default(true) // Varier les horaires de ±15min

skipWeekends Boolean \@default(false)

createdAt DateTime \@default(now())

updatedAt DateTime \@updatedAt

@@unique(\[userId\])

}

\`\`\`

\*\*1.2 Migration\*\*

\`\`\`bash

npx prisma migrate dev \--name add_behavior_tracking

\`\`\`

\#### \*\*Phase 2 : Service d\'analyse comportementale\*\*

\*\*2.1 Créer \`/lib/ai/behavior-analysis.service.ts\`\*\*

\`\`\`typescript

import prisma from \'@/lib/prisma\';

import OpenAI from \'openai\';

const openai = new OpenAI({

apiKey: process.env.OPENAI_API_KEY

});

interface BehaviorAnalysis {

patterns: Record\<string, any\>;

insights: string\[\];

recommendations: string\[\];

correlations: Record\<string, number\>;

averages: {

mood: number;

focus: number;

motivation: number;

energy: number;

stress: number;

};

}

export async function analyzeBehaviorPatterns(

userId: string,

days: number = 7

): Promise\<BehaviorAnalysis\> {

// Récupérer tous les check-ins de la période

const checkIns = await prisma.behaviorCheckIn.findMany({

where: {

userId,

timestamp: {

gte: new Date(Date.now() - days \* 24 \* 60 \* 60 \* 1000)

}

},

orderBy: { timestamp: \'asc\' }

});

if (checkIns.length \< 5) {

return {

patterns: {},

insights: \[\'Continue à renseigner tes états pour recevoir une
analyse\'\],

recommendations: \[\],

correlations: {},

averages: { mood: 0, focus: 0, motivation: 0, energy: 0, stress: 0 }

};

}

// Calculer les moyennes par type

const averages = calculateAverages(checkIns);

// Détecter des patterns temporels

const patterns = detectTimePatterns(checkIns);

// Calculer les corrélations

const correlations = calculateCorrelations(checkIns);

// Générer insights via IA

const aiAnalysis = await generateAIInsights(checkIns, averages,
patterns, correlations);

return {

patterns,

insights: aiAnalysis.insights,

recommendations: aiAnalysis.recommendations,

correlations,

averages

};

}

function calculateAverages(checkIns: any\[\]) {

const byType = {

mood: \[\] as number\[\],

focus: \[\] as number\[\],

motivation: \[\] as number\[\],

energy: \[\] as number\[\],

stress: \[\] as number\[\]

};

checkIns.forEach(ci =\> {

if (byType\[ci.type as keyof typeof byType\]) {

byType\[ci.type as keyof typeof byType\].push(ci.value);

}

});

return {

mood: avg(byType.mood),

focus: avg(byType.focus),

motivation: avg(byType.motivation),

energy: avg(byType.energy),

stress: avg(byType.stress)

};

}

function detectTimePatterns(checkIns: any\[\]) {

const byHour: Record\<number, { values: number\[\]; types: string\[\]
}\> = {};

checkIns.forEach(ci =\> {

const hour = new Date(ci.timestamp).getHours();

if (!byHour\[hour\]) byHour\[hour\] = { values: \[\], types: \[\] };

byHour\[hour\].values.push(ci.value);

byHour\[hour\].types.push(ci.type);

});

// Identifier les pics et creux

const hourlyAvg = Object.entries(byHour).map((\[hour, data\]) =\> ({

hour: parseInt(hour),

avg: avg(data.values)

}));

const peakHours = hourlyAvg

.filter(h =\> h.avg \>= 7)

.map(h =\> h.hour);

const lowHours = hourlyAvg

.filter(h =\> h.avg \<= 4)

.map(h =\> h.hour);

return {

peakHours,

lowHours,

morningAvg: avg(hourlyAvg.filter(h =\> h.hour \>= 6 && h.hour \<
12).map(h =\> h.avg)),

afternoonAvg: avg(hourlyAvg.filter(h =\> h.hour \>= 12 && h.hour \<
18).map(h =\> h.avg)),

eveningAvg: avg(hourlyAvg.filter(h =\> h.hour \>= 18).map(h =\> h.avg))

};

}

function calculateCorrelations(checkIns: any\[\]) {

// Simplification : corrélation entre focus et energy

const focusValues = checkIns.filter(ci =\> ci.type === \'focus\').map(ci
=\> ci.value);

const energyValues = checkIns.filter(ci =\> ci.type ===
\'energy\').map(ci =\> ci.value);

const correlations: Record\<string, number\> = {};

if (focusValues.length \> 3 && energyValues.length \> 3) {

// Calculer corrélation de Pearson (simplifiée)

const minLength = Math.min(focusValues.length, energyValues.length);

const focus = focusValues.slice(0, minLength);

const energy = energyValues.slice(0, minLength);

correlations.focus_energy = pearsonCorrelation(focus, energy);

}

// Autres corrélations possibles

const moodValues = checkIns.filter(ci =\> ci.type === \'mood\').map(ci
=\> ci.value);

const stressValues = checkIns.filter(ci =\> ci.type ===
\'stress\').map(ci =\> ci.value);

if (moodValues.length \> 3 && stressValues.length \> 3) {

const minLength = Math.min(moodValues.length, stressValues.length);

correlations.mood_stress = pearsonCorrelation(

moodValues.slice(0, minLength),

stressValues.slice(0, minLength)

);

}

return correlations;

}

async function generateAIInsights(

checkIns: any\[\],

averages: any,

patterns: any,

correlations: any

): Promise\<{ insights: string\[\]; recommendations: string\[\] }\> {

const summary = \`

Données utilisateur sur \${checkIns.length} check-ins:

\- Moyennes: Humeur \${averages.mood.toFixed(1)}/10, Focus
\${averages.focus.toFixed(1)}/10, Motivation
\${averages.motivation.toFixed(1)}/10, Énergie
\${averages.energy.toFixed(1)}/10, Stress
\${averages.stress.toFixed(1)}/10

\- Pics de performance: \${patterns.peakHours.join(\', \')}h

\- Baisses: \${patterns.lowHours.join(\', \')}h

\- Matin: \${patterns.morningAvg.toFixed(1)}, Après-midi:
\${patterns.afternoonAvg.toFixed(1)}, Soir:
\${patterns.eveningAvg.toFixed(1)}

\- Corrélations: \${JSON.stringify(correlations)}

\`;

const prompt = \`En tant qu\'expert en productivité et bien-être,
analyse ces données comportementales et génère:

1\. 3-5 insights clés sur les patterns de l\'utilisateur

2\. 3-5 recommandations concrètes et actionnables

\${summary}

Réponds au format JSON:

{

\"insights\": \[\"insight 1\", \"insight 2\", \...\],

\"recommendations\": \[\"recommandation 1\", \"recommandation 2\",
\...\]

}\`;

const response = await openai.chat.completions.create({

model: \'gpt-4-turbo-preview\',

messages: \[

{ role: \'system\', content: \'Tu es un expert en psychologie de la
productivité. Réponds en JSON.\' },

{ role: \'user\', content: prompt }

\],

temperature: 0.5,

response_format: { type: \'json_object\' }

});

return JSON.parse(response.choices\[0\].message.content!);

}

// Utils

function avg(arr: number\[\]): number {

if (arr.length === 0) return 0;

return arr.reduce((a, b) =\> a + b, 0) / arr.length;

}

function pearsonCorrelation(x: number\[\], y: number\[\]): number {

const n = x.length;

const sumX = x.reduce((a, b) =\> a + b, 0);

const sumY = y.reduce((a, b) =\> a + b, 0);

const sumXY = x.reduce((sum, xi, i) =\> sum + xi \* y\[i\], 0);

const sumX2 = x.reduce((sum, xi) =\> sum + xi \* xi, 0);

const sumY2 = y.reduce((sum, yi) =\> sum + yi \* yi, 0);

const numerator = n \* sumXY - sumX \* sumY;

const denominator = Math.sqrt((n \* sumX2 - sumX \* sumX) \* (n \*
sumY2 - sumY \* sumY));

return denominator === 0 ? 0 : numerator / denominator;

}

\`\`\`

\#### \*\*Phase 3 : API Endpoints\*\*

\*\*3.1 Créer \`/app/api/behavior/agent/checkin/route.ts\`\*\*

\`\`\`typescript

import { NextRequest, NextResponse } from \'next/server\';

import { verifyApiToken } from \'@/middleware/api-auth\';

import prisma from \'@/lib/prisma\';

// POST : enregistrer un check-in

export async function POST(req: NextRequest) {

const verification = await verifyApiToken(req, \[\'behavior:write\'\]);

if (!verification.valid) {

return NextResponse.json({ error: verification.error }, { status: 401
});

}

const { type, value, note, context } = await req.json();

const userId = verification.payload.userId;

// Validation

if (!\[\'mood\', \'focus\', \'motivation\', \'energy\',
\'stress\'\].includes(type)) {

return NextResponse.json({ error: \'Type invalide\' }, { status: 400 });

}

if (value \< 1 \|\| value \> 10) {

return NextResponse.json({ error: \'Valeur doit être entre 1 et 10\' },
{ status: 400 });

}

const checkIn = await prisma.behaviorCheckIn.create({

data: {

userId,

type,

value,

note,

context,

triggeredBy: \'manual\'

}

});

return NextResponse.json({

checkIn,

message: \`\${getTypeEmoji(type)} Check-in enregistré ! (\${value}/10)\`

});

}

// GET : récupérer les check-ins récents export async function GET(req:
NextRequest) { const verification = await verifyApiToken(req,
\[\'behavior:read\'\]); if (!verification.valid) { return
NextResponse.json({ error: verification.error }, { status: 401 }); }

const { searchParams } = new URL(req.url); const days =
parseInt(searchParams.get(\'days\') \|\| \'7\'); const type =
searchParams.get(\'type\'); // Filtrer par type si spécifié const userId
= verification.payload.userId;

const where: any = { userId, timestamp: { gte: new Date(Date.now() -
days \* 24 \* 60 \* 60 \* 1000) } };

if (type) { where.type = type; }

const checkIns = await prisma.behaviorCheckIn.findMany({ where, orderBy:
{ timestamp: \'desc\' }, take: 100 });

return NextResponse.json({ checkIns }); }

function getTypeEmoji(type: string): string { const emojis:
Record\<string, string\> = { mood: \'😊\', focus: \'🎯\', motivation:
\'🔥\', energy: \'⚡\', stress: \'😰\' }; return emojis\[type\] \|\|
\'📊\'; }

\*\*3.2 Créer \`/app/api/behavior/agent/analysis/route.ts\`\*\*
\`\`\`typescript import { NextRequest, NextResponse } from
\'next/server\'; import { verifyApiToken } from
\'@/middleware/api-auth\'; import { analyzeBehaviorPatterns } from
\'@/lib/ai/behavior-analysis.service\'; import prisma from
\'@/lib/prisma\'; // GET : récupérer ou générer l\'analyse export async
function GET(req: NextRequest) { const verification = await
verifyApiToken(req, \[\'behavior:read\'\]); if (!verification.valid) {
return NextResponse.json({ error: verification.error }, { status: 401
}); } const { searchParams } = new URL(req.url); const days =
parseInt(searchParams.get(\'days\') \|\| \'7\'); const userId =
verification.payload.userId; const startDate = new Date(Date.now() -
days \* 24 \* 60 \* 60 \* 1000); const endDate = new Date();
startDate.setHours(0, 0, 0, 0); endDate.setHours(23, 59, 59, 999); //
Chercher analyse existante récente let pattern = await
prisma.behaviorPattern.findFirst({ where: { userId, startDate: { gte:
startDate }, endDate: { lte: endDate } }, orderBy: { createdAt: \'desc\'
} }); // Générer si pas trouvée ou trop ancienne (\> 24h) if (!pattern
\|\| new Date().getTime() - pattern.createdAt.getTime() \> 24 \* 60 \*
60 \* 1000) { const analysis = await analyzeBehaviorPatterns(userId,
days); pattern = await prisma.behaviorPattern.create({ data: { userId,
startDate, endDate, patterns: analysis.patterns, avgMood:
analysis.averages.mood, avgFocus: analysis.averages.focus,
avgMotivation: analysis.averages.motivation, avgEnergy:
analysis.averages.energy, avgStress: analysis.averages.stress, insights:
analysis.insights, recommendations: analysis.recommendations,
correlations: analysis.correlations } }); } return NextResponse.json({
pattern }); } // POST : forcer la régénération export async function
POST(req: NextRequest) { const verification = await verifyApiToken(req,
\[\'behavior:write\'\]); if (!verification.valid) { return
NextResponse.json({ error: verification.error }, { status: 401 }); }
const { days = 7 } = await req.json(); const userId =
verification.payload.userId; const analysis = await
analyzeBehaviorPatterns(userId, days); const startDate = new
Date(Date.now() - days \* 24 \* 60 \* 60 \* 1000); const endDate = new
Date(); startDate.setHours(0, 0, 0, 0); endDate.setHours(23, 59, 59,
999); const pattern = await prisma.behaviorPattern.create({ data: {
userId, startDate, endDate, patterns: analysis.patterns, avgMood:
analysis.averages.mood, avgFocus: analysis.averages.focus,
avgMotivation: analysis.averages.motivation, avgEnergy:
analysis.averages.energy, avgStress: analysis.averages.stress, insights:
analysis.insights, recommendations: analysis.recommendations,
correlations: analysis.correlations } }); return NextResponse.json({
pattern }); } \`\`\` \*\*3.3 Créer
\`/app/api/behavior/agent/schedule/route.ts\`\*\* \`\`\`typescript
import { NextRequest, NextResponse } from \'next/server\'; import {
verifyApiToken } from \'@/middleware/api-auth\'; import prisma from
\'@/lib/prisma\'; // GET : récupérer la config de planning export async
function GET(req: NextRequest) { const verification = await
verifyApiToken(req, \[\'behavior:read\'\]); if (!verification.valid) {
return NextResponse.json({ error: verification.error }, { status: 401
}); } const userId = verification.payload.userId; let schedule = await
prisma.checkInSchedule.findUnique({ where: { userId } }); // Créer
config par défaut si n\'existe pas if (!schedule) { schedule = await
prisma.checkInSchedule.create({ data: { userId, enabled: true,
frequency: \'3x_daily\', schedules: \[ { time: \'09:00\', types:
\[\'mood\', \'energy\'\] }, { time: \'14:00\', types: \[\'focus\',
\'motivation\'\] }, { time: \'18:00\', types: \[\'mood\', \'stress\'\] }
\], randomize: true, skipWeekends: false } }); } return
NextResponse.json({ schedule }); } // PATCH : mettre à jour la config
export async function PATCH(req: NextRequest) { const verification =
await verifyApiToken(req, \[\'behavior:write\'\]); if
(!verification.valid) { return NextResponse.json({ error:
verification.error }, { status: 401 }); } const updates = await
req.json(); const userId = verification.payload.userId; const schedule =
await prisma.checkInSchedule.upsert({ where: { userId }, create: {
userId, \...updates }, update: updates }); return NextResponse.json({
schedule }); } \`\`\` \#### \*\*Phase 4 : Handler WhatsApp pour les
check-ins\*\* \*\*4.1 Créer
\`/lib/agent/handlers/behavior.handler.ts\`\*\* \`\`\`typescript import
{ sendWhatsAppMessage } from \'@/lib/whatsapp\'; import prisma from
\'@/lib/prisma\'; const QUESTION_TEMPLATES = { mood: \[ \'😊 Comment te
sens-tu en ce moment ? (1-10)\', \'😊 Quelle est ton humeur actuellement
? (1-10)\', \'🌟 Comment évalues-tu ton humeur ? (1-10)\' \], focus: \[
\'🎯 Quel est ton niveau de concentration ? (1-10)\', \'🎯 Es-tu
concentré en ce moment ? (1-10)\', \'🔍 Comment évalues-tu ta capacité
de focus actuelle ? (1-10)\' \], motivation: \[ \'🔥 Quel est ton niveau
de motivation ? (1-10)\', \'💪 Te sens-tu motivé(e) en ce moment ?
(1-10)\', \'🚀 Comment est ta motivation aujourd\\\'hui ? (1-10)\' \],
energy: \[ \'⚡ Quel est ton niveau d\\\'énergie ? (1-10)\', \'⚡
Comment te sens-tu niveau énergie ? (1-10)\', \'🔋 Évalue ton niveau
d\\\'énergie actuel (1-10)\' \], stress: \[ \'😰 Quel est ton niveau de
stress ? (1-10)\', \'😌 Te sens-tu stressé(e) ? (1-10)\', \'💆 Comment
évalues-tu ton stress actuellement ? (1-10)\' \] }; export async
function handleBehaviorCheckInCommand( message: string, userId: string,
phoneNumber: string, apiToken: string ) { const lowerMessage =
message.toLowerCase(); // Commandes pour voir l\'analyse if
(lowerMessage.includes(\'analyse\') \|\|
lowerMessage.includes(\'rapport\') \|\|
lowerMessage.includes(\'pattern\')) { return await
sendBehaviorAnalysis(userId, phoneNumber, apiToken); } // Commandes pour
voir les tendances if (lowerMessage.includes(\'tendance\') \|\|
lowerMessage.includes(\'évolution\')) { return await sendTrends(userId,
phoneNumber, apiToken); } // Check si c\'est une réponse à une question
de check-in const awaitingState = await
getUserConversationState(userId); if
(awaitingState?.state?.startsWith(\'awaiting_checkin\_\')) { const type
= awaitingState.state.replace(\'awaiting_checkin\_\', \'\'); return
await processCheckInResponse(message, type, userId, phoneNumber,
apiToken); } return false; } export async function
triggerScheduledCheckIn( userId: string, phoneNumber: string, types:
string\[\] ) { // Récupérer les préférences const schedule = await
prisma.checkInSchedule.findUnique({ where: { userId } }); if
(!schedule?.enabled) return; // Choisir un type aléatoire parmi ceux
proposés const type = types\[Math.floor(Math.random() \*
types.length)\]; // Choisir une question aléatoire const questions =
QUESTION_TEMPLATES\[type as keyof typeof QUESTION_TEMPLATES\]; const
question = questions\[Math.floor(Math.random() \* questions.length)\];
// Enregistrer l\'état conversationnel await
setUserConversationState(userId, \`awaiting_checkin\_\${type}\`); await
sendWhatsAppMessage(phoneNumber, question); } async function
processCheckInResponse( message: string, type: string, userId: string,
phoneNumber: string, apiToken: string ) { // Extraire la valeur
numérique const match = message.match(/(\\d+)/); if (!match) { await
sendWhatsAppMessage( phoneNumber, \'🤔 Réponds simplement avec un
chiffre de 1 à 10 !\' ); return true; } const value =
parseInt(match\[1\]); if (value \< 1 \|\| value \> 10) { await
sendWhatsAppMessage( phoneNumber, \'📊 Le chiffre doit être entre 1 et
10. Réessaye !\' ); return true; } // Enregistrer le check-in const
response = await fetch(
\`\${process.env.NEXT_PUBLIC_APP_URL}/api/behavior/agent/checkin\`, {
method: \'POST\', headers: { \'Authorization\': \`Bearer \${apiToken}\`,
\'Content-Type\': \'application/json\' }, body: JSON.stringify({ type,
value, triggeredBy: \'scheduled\' }) } ); if (response.ok) { const
feedback = generateFeedback(type, value); await
sendWhatsAppMessage(phoneNumber, feedback); // Nettoyer l\'état await
clearUserConversationState(userId); } else { await sendWhatsAppMessage(
phoneNumber, \'❌ Oups, erreur d\\\'enregistrement. Réessaye plus tard
!\' ); } return true; } function generateFeedback(type: string, value:
number): string { const emoji = getTypeEmoji(type); if (value \>= 8) {
return \`\${emoji} Super ! \${value}/10 - Continue comme ça ! 🎉\`; }
else if (value \>= 5) { return \`\${emoji} Ok, \${value}/10 enregistré.
Tu peux faire mieux ! 💪\`; } else { return \`\${emoji} \${value}/10\...
Prends soin de toi ! 🫂\\n\\nBesoin d\'une pause ?\`; } } function
getTypeEmoji(type: string): string { const emojis: Record\<string,
string\> = { mood: \'😊\', focus: \'🎯\', motivation: \'🔥\', energy:
\'⚡\', stress: \'😰\' }; return emojis\[type\] \|\| \'📊\'; } async
function sendBehaviorAnalysis( userId: string, phoneNumber: string,
apiToken: string ) { const response = await fetch(
\`\${process.env.NEXT_PUBLIC_APP_URL}/api/behavior/agent/analysis?days=7\`,
{ headers: { \'Authorization\': \`Bearer \${apiToken}\` } } ); const {
pattern } = await response.json(); if (!pattern \|\|
pattern.insights.length === 0) { await sendWhatsAppMessage( phoneNumber,
\'📊 Continue à répondre aux questions quotidiennes pour recevoir ton
analyse comportementale !\' ); return true; } let message = \`📊 \*\*Ton
analyse des 7 derniers jours\*\*\\n\\n\`; // Moyennes message += \`📈
\*\*Moyennes:\*\*\\n\`; message += \`😊 Humeur:
\${pattern.avgMood?.toFixed(1) \|\| \'N/A\'}/10\\n\`; message += \`🎯
Focus: \${pattern.avgFocus?.toFixed(1) \|\| \'N/A\'}/10\\n\`; message +=
\`🔥 Motivation: \${pattern.avgMotivation?.toFixed(1) \|\|
\'N/A\'}/10\\n\`; message += \`⚡ Énergie:
\${pattern.avgEnergy?.toFixed(1) \|\| \'N/A\'}/10\\n\`; message += \`😰
Stress: \${pattern.avgStress?.toFixed(1) \|\| \'N/A\'}/10\\n\\n\`; //
Insights if (pattern.insights.length \> 0) { message += \`💡
\*\*Insights clés:\*\*\\n\`; pattern.insights.forEach((insight: string,
idx: number) =\> { message += \`\${idx + 1}. \${insight}\\n\`; });
message += \`\\n\`; } // Recommandations if
(pattern.recommendations.length \> 0) { message += \`🎯
\*\*Recommandations:\*\*\\n\`; pattern.recommendations.forEach((rec:
string, idx: number) =\> { message += \`\${idx + 1}. \${rec}\\n\`; }); }
await sendWhatsAppMessage(phoneNumber, message); return true; } async
function sendTrends( userId: string, phoneNumber: string, apiToken:
string ) { // Récupérer les check-ins des 7 derniers jours const
response = await fetch(
\`\${process.env.NEXT_PUBLIC_APP_URL}/api/behavior/agent/checkin?days=7\`,
{ headers: { \'Authorization\': \`Bearer \${apiToken}\` } } ); const {
checkIns } = await response.json(); if (!checkIns \|\| checkIns.length
\< 3) { await sendWhatsAppMessage( phoneNumber, \'📊 Pas assez de
données pour afficher les tendances. Continue à répondre aux questions
!\' ); return true; } // Grouper par type et calculer tendances const
byType: Record\<string, number\[\]\> = {}; checkIns.forEach((ci: any)
=\> { if (!byType\[ci.type\]) byType\[ci.type\] = \[\];
byType\[ci.type\].push(ci.value); }); let message = \`📈 \*\*Tes
tendances sur 7 jours\*\*\\n\\n\`;
Object.entries(byType).forEach((\[type, values\]) =\> { const avg =
values.reduce((a, b) =\> a + b, 0) / values.length; const trend =
values.length \> 1 ? values\[values.length - 1\] - values\[0\] : 0;
const trendEmoji = trend \> 0 ? \'📈\' : trend \< 0 ? \'📉\' : \'➡️\';
const emoji = getTypeEmoji(type); message += \`\${emoji}
\*\*\${capitalize(type)}\*\*: \${avg.toFixed(1)}/10 \${trendEmoji}\\n\`;
}); await sendWhatsAppMessage(phoneNumber, message); return true; }
function capitalize(str: string): string { return
str.charAt(0).toUpperCase() + str.slice(1); } // Helpers pour l\'état
conversationnel async function getUserConversationState(userId: string)
{ return await prisma.userConversationState.findUnique({ where: { userId
} }).catch(() =\> null); } async function
setUserConversationState(userId: string, state: string) { await
prisma.userConversationState.upsert({ where: { userId }, create: {
userId, state, data: {} }, update: { state, data: {} } }); } async
function clearUserConversationState(userId: string) { await
prisma.userConversationState.delete({ where: { userId } }).catch(() =\>
{}); } \`\`\` \*\*4.2 Intégrer au routeur WhatsApp\*\* \`\`\`typescript
// app/api/webhooks/whatsapp/route.ts import {
handleBehaviorCheckInCommand } from
\'@/lib/agent/handlers/behavior.handler\'; // Dans le handler des
messages texte const behaviorHandled = await
handleBehaviorCheckInCommand( messageText, userId, phoneNumber, apiToken
); if (behaviorHandled) return new NextResponse(\'OK\', { status: 200
}); // \... autres handlers \`\`\` \#### \*\*Phase 5 : Scheduler pour
les check-ins automatiques\*\* \*\*5.1 Créer
\`/lib/behavior/BehaviorCheckInScheduler.ts\`\*\* \`\`\`typescript
import cron from \'node-cron\'; import prisma from \'@/lib/prisma\';
import { triggerScheduledCheckIn } from
\'@/lib/agent/handlers/behavior.handler\'; export class
BehaviorCheckInScheduler { private cronJobs: Map\<string,
cron.ScheduledTask\> = new Map(); async start() {
console.log(\'BehaviorCheckInScheduler démarrage\...\'); // Charger
toutes les configurations utilisateurs const schedules = await
prisma.checkInSchedule.findMany({ where: { enabled: true }, include: {
user: { include: { notificationPreferences: true } } } }); for (const
schedule of schedules) { this.scheduleUserCheckIns(schedule); }
console.log(\`BehaviorCheckInScheduler démarré pour \${schedules.length}
utilisateurs\`); } stop() { this.cronJobs.forEach(job =\> job.stop());
this.cronJobs.clear(); console.log(\'BehaviorCheckInScheduler arrêté\');
} private scheduleUserCheckIns(schedule: any) { const userId =
schedule.userId; const phoneNumber =
schedule.user.notificationPreferences?.whatsappNumber; if (!phoneNumber
\|\| !schedule.user.notificationPreferences?.whatsappEnabled) { return;
} // Parser les horaires personnalisés const schedules =
schedule.schedules as Array\<{ time: string; types: string\[\] }\>;
schedules.forEach((sched, idx) =\> { const \[hour, minute\] =
sched.time.split(\':\').map(Number); // Ajuster avec randomization si
activé let finalHour = hour; let finalMinute = minute; if
(schedule.randomize) { const offset = Math.floor(Math.random() \* 31) -
15; // -15 à +15 min finalMinute += offset; if (finalMinute \< 0) {
finalMinute += 60; finalHour -= 1; } else if (finalMinute \>= 60) {
finalMinute -= 60; finalHour += 1; } } // Construire le cron pattern let
cronPattern = \`\${finalMinute} \${finalHour} \* \* \*\`; if
(schedule.skipWeekends) { cronPattern = \`\${finalMinute} \${finalHour}
\* \* 1-5\`; // Lundi-Vendredi } const jobKey = \`\${userId}-\${idx}\`;
const job = cron.schedule(cronPattern, async () =\> { try { await
triggerScheduledCheckIn(userId, phoneNumber, sched.types); } catch
(error) { console.error(\`Erreur envoi check-in pour \${userId}:\`,
error); } }, { timezone: \'Europe/Paris\' }); this.cronJobs.set(jobKey,
job); }); } async updateUserSchedule(userId: string) { // Supprimer les
jobs existants pour cet utilisateur this.cronJobs.forEach((job, key) =\>
{ if (key.startsWith(userId)) { job.stop(); this.cronJobs.delete(key); }
}); // Recharger et reprogrammer const schedule = await
prisma.checkInSchedule.findUnique({ where: { userId }, include: { user:
{ include: { notificationPreferences: true } } } }); if
(schedule?.enabled) { this.scheduleUserCheckIns(schedule); } } } export
const behaviorCheckInScheduler = new BehaviorCheckInScheduler(); \`\`\`
\*\*5.2 Intégrer au scheduler principal\*\* \`\`\`typescript //
lib/ReactiveSchedulerManager.js import { behaviorCheckInScheduler } from
\'./behavior/BehaviorCheckInScheduler\'; // Dans start() await
behaviorCheckInScheduler.start(); // Dans stop()
behaviorCheckInScheduler.stop(); \`\`\` \#### \*\*Phase 6 : Modèle
conversationnel (optionnel)\*\* \*\*6.1 Créer le modèle
UserConversationState si pas déjà existant\*\* \`\`\`prisma //
schema.prisma model UserConversationState { id String \@id
\@default(cuid()) userId String \@unique user User \@relation(fields:
\[userId\], references: \[id\]) state String // awaiting_checkin_mood,
awaiting_deepwork_duration, etc. data Json? // Données contextuelles
expiresAt DateTime? createdAt DateTime \@default(now()) updatedAt
DateTime \@updatedAt } \`\`\` \#### \*\*Phase 7 : Scopes et
permissions\*\* \*\*7.1 Ajouter les scopes\*\* \`\`\`typescript //
middleware/api-auth.ts export const AVAILABLE_SCOPES = \[ // \...
existants \'behavior:read\', \'behavior:write\' \]; \`\`\` \-\-- \## 📋
Récapitulatif des étapes d\'implémentation \### Feature 1 : Deep Work
Sessions 1. ✅ Modèle données (DeepWorkSession) 2. ✅ API endpoints
(start, update, complete) 3. ✅ Scheduler auto-completion 4. ✅ Handler
WhatsApp conversationnel 5. ✅ Scopes et permissions \### Feature 2 :
Journaling Vocal 1. ✅ Modèle données (JournalEntry, DailyInsight) 2. ✅
Stockage audio (S3/R2) 3. ✅ Service transcription (Whisper) 4. ✅
Service analyse IA (GPT-4) 5. ✅ API endpoints (upload, insights) 6. ✅
Handler WhatsApp (vocaux + commandes) 7. ✅ Scheduler matinal (7h) 8. ✅
Scopes et permissions \### Feature 3 : Analyse Comportementale 1. ✅
Modèles données (BehaviorCheckIn, BehaviorPattern, CheckInSchedule) 2.
✅ Service d\'analyse (patterns, corrélations, IA) 3. ✅ API endpoints
(check-in, analysis, schedule) 4. ✅ Handler WhatsApp
(questions/réponses) 5. ✅ Scheduler check-ins automatiques 6. ✅ Scopes
et permissions \-\--
