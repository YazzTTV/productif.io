**Système de Free Trial 7 jours - Plan d\'action complet**

**Productif.io - Instructions pour agent IA**

**📋 Objectif**

Implémenter un système de période d\'essai gratuite de 7 jours qui :

1.  S\'active automatiquement à l\'inscription

2.  Bloque l\'accès à l\'app web après 7 jours

3.  Bloque l\'accès à l\'agent IA WhatsApp après 7 jours

4.  Permet de débloquer via abonnement Stripe

5.  Affiche des rappels avant expiration

6.  Offre une expérience fluide de conversion

**Phase 1 : Modèle de données**

**1.1 Modifier le modèle User**

**Fichier** : prisma/schema.prisma

**Action** : Ajouter les champs suivants dans le modèle User

model User {

// \... champs existants

// Free Trial

trialStartDate DateTime? // Date de début du trial

trialEndDate DateTime? // Date de fin du trial

trialStatus String \@default(\"active\") // active, expired, converted

// Subscription

subscriptionStatus String \@default(\"trial\") // trial, active,
cancelled, expired

subscriptionTier String? // starter, pro, enterprise

stripeCustomerId String? \@unique

stripeSubscriptionId String? \@unique

subscriptionEndDate DateTime?

// Historique

convertedAt DateTime? // Date de conversion trial → paid

cancelledAt DateTime?

// \... reste du modèle

}

**1.2 Créer le modèle TrialNotification**

**Fichier** : prisma/schema.prisma

**Action** : Ajouter le nouveau modèle

model TrialNotification {

id String \@id \@default(cuid())

userId String

user User \@relation(fields: \[userId\], references: \[id\], onDelete:
Cascade)

type String // reminder_3days, reminder_1day, expired

sentAt DateTime \@default(now())

channel String // email, whatsapp, in_app

createdAt DateTime \@default(now())

@@index(\[userId, type\])

@@index(\[sentAt\])

}

**1.3 Migration**

npx prisma migrate dev \--name add_trial_system

npx prisma generate

**Phase 2 : Service de gestion des trials**

**2.1 Créer le service TrialService**

**Fichier** : lib/trial/TrialService.ts

**Action** : Créer le fichier avec le contenu suivant

import prisma from \'@/lib/prisma\';

export class TrialService {

private static TRIAL_DURATION_DAYS = 7;

/\*\*

\* Initialiser le trial à l\'inscription

\*/

static async initializeTrial(userId: string): Promise\<void\> {

const now = new Date();

const trialEndDate = new Date(now.getTime() + this.TRIAL_DURATION_DAYS
\* 24 \* 60 \* 60 \* 1000);

await prisma.user.update({

where: { id: userId },

data: {

trialStartDate: now,

trialEndDate,

trialStatus: \'active\',

subscriptionStatus: \'trial\'

}

});

console.log(\`✅ Trial initialisé pour user \${userId} jusqu\'au
\${trialEndDate.toISOString()}\`);

}

/\*\*

\* Vérifier si un utilisateur a accès (trial actif ou subscription
active)

\*/

static async hasAccess(userId: string): Promise\<{

hasAccess: boolean;

reason?: string;

trialDaysLeft?: number;

status: \'trial_active\' \| \'trial_expired\' \| \'subscribed\' \|
\'cancelled\';

}\> {

const user = await prisma.user.findUnique({

where: { id: userId },

select: {

trialStartDate: true,

trialEndDate: true,

trialStatus: true,

subscriptionStatus: true,

subscriptionEndDate: true

}

});

if (!user) {

return {

hasAccess: false,

reason: \'Utilisateur non trouvé\',

status: \'trial_expired\'

};

}

const now = new Date();

// Cas 1 : Subscription active

if (user.subscriptionStatus === \'active\') {

if (user.subscriptionEndDate && user.subscriptionEndDate \> now) {

return {

hasAccess: true,

status: \'subscribed\'

};

}

}

// Cas 2 : Trial actif

if (user.subscriptionStatus === \'trial\') {

if (user.trialEndDate && user.trialEndDate \> now) {

const trialDaysLeft = Math.ceil(

(user.trialEndDate.getTime() - now.getTime()) / (24 \* 60 \* 60 \* 1000)

);

return {

hasAccess: true,

trialDaysLeft,

status: \'trial_active\'

};

} else {

// Trial expiré

await this.expireTrial(userId);

return {

hasAccess: false,

reason: \'Période d\\\'essai expirée\',

trialDaysLeft: 0,

status: \'trial_expired\'

};

}

}

// Cas 3 : Tout le reste = pas d\'accès

return {

hasAccess: false,

reason: \'Aucun abonnement actif\',

status: \'trial_expired\'

};

}

/\*\*

\* Marquer le trial comme expiré

\*/

static async expireTrial(userId: string): Promise\<void\> {

await prisma.user.update({

where: { id: userId },

data: {

trialStatus: \'expired\',

subscriptionStatus: \'expired\'

}

});

console.log(\`⏰ Trial expiré pour user \${userId}\`);

}

/\*\*

\* Convertir un trial en subscription payante

\*/

static async convertTrialToSubscription(

userId: string,

stripeCustomerId: string,

stripeSubscriptionId: string,

tier: string = \'pro\'

): Promise\<void\> {

const now = new Date();

const subscriptionEndDate = new Date(now.getTime() + 30 \* 24 \* 60 \*
60 \* 1000); // 30 jours

await prisma.user.update({

where: { id: userId },

data: {

trialStatus: \'converted\',

subscriptionStatus: \'active\',

subscriptionTier: tier,

stripeCustomerId,

stripeSubscriptionId,

subscriptionEndDate,

convertedAt: now

}

});

console.log(\`🎉 Trial converti en subscription pour user \${userId}\`);

}

/\*\*

\* Récupérer les utilisateurs dont le trial expire bientôt

\*/

static async getUsersWithExpiringTrial(daysBeforeExpiration: number):
Promise\<any\[\]\> {

const now = new Date();

const targetDate = new Date(now.getTime() + daysBeforeExpiration \* 24
\* 60 \* 60 \* 1000);

const targetDateEnd = new Date(targetDate.getTime() + 24 \* 60 \* 60 \*
1000);

const users = await prisma.user.findMany({

where: {

subscriptionStatus: \'trial\',

trialStatus: \'active\',

trialEndDate: {

gte: targetDate,

lt: targetDateEnd

}

},

include: {

notificationPreferences: true

}

});

return users;

}

/\*\*

\* Enregistrer qu\'une notification a été envoyée

\*/

static async recordNotificationSent(

userId: string,

type: string,

channel: string

): Promise\<void\> {

await prisma.trialNotification.create({

data: {

userId,

type,

channel

}

});

}

/\*\*

\* Vérifier si une notification a déjà été envoyée

\*/

static async hasNotificationBeenSent(userId: string, type: string):
Promise\<boolean\> {

const notification = await prisma.trialNotification.findFirst({

where: {

userId,

type

}

});

return !!notification;

}

/\*\*

\* Obtenir des statistiques sur les trials

\*/

static async getTrialStats(): Promise\<{

activeTrials: number;

expiredTrials: number;

convertedTrials: number;

conversionRate: number;

}\> {

const \[activeTrials, expiredTrials, convertedTrials\] = await
Promise.all(\[

prisma.user.count({

where: {

subscriptionStatus: \'trial\',

trialStatus: \'active\'

}

}),

prisma.user.count({

where: {

trialStatus: \'expired\'

}

}),

prisma.user.count({

where: {

trialStatus: \'converted\'

}

})

\]);

const totalTrials = activeTrials + expiredTrials + convertedTrials;

const conversionRate = totalTrials \> 0 ? (convertedTrials /
totalTrials) \* 100 : 0;

return {

activeTrials,

expiredTrials,

convertedTrials,

conversionRate

};

}

}

**Phase 3 : Middleware de vérification d\'accès**

**3.1 Middleware pour l\'app web**

**Fichier** : middleware/trial-check.ts

**Action** : Créer le fichier

import { NextRequest, NextResponse } from \'next/server\';

import { getServerSession } from \'next-auth\';

import { authOptions } from \'@/lib/auth\';

import { TrialService } from \'@/lib/trial/TrialService\';

export async function trialCheckMiddleware(req: NextRequest) {

const session = await getServerSession(authOptions);

if (!session?.user?.id) {

return NextResponse.redirect(new URL(\'/login\', req.url));

}

const accessCheck = await TrialService.hasAccess(session.user.id);

if (!accessCheck.hasAccess) {

// Rediriger vers la page d\'upgrade

return NextResponse.redirect(new URL(\'/upgrade\', req.url));

}

// Ajouter les infos de trial dans les headers pour l\'UI

const response = NextResponse.next();

response.headers.set(\'X-Trial-Status\', accessCheck.status);

if (accessCheck.trialDaysLeft !== undefined) {

response.headers.set(\'X-Trial-Days-Left\',
accessCheck.trialDaysLeft.toString());

}

return response;

}

**3.2 Intégrer au middleware global**

**Fichier** : middleware.ts (à la racine du projet)

**Action** : Créer ou modifier pour inclure la vérification

import { NextRequest, NextResponse } from \'next/server\';

import { trialCheckMiddleware } from \'./middleware/trial-check\';

export async function middleware(req: NextRequest) {

const { pathname } = req.nextUrl;

// Routes publiques exemptées

const publicRoutes = \[

\'/login\',

\'/register\',

\'/upgrade\',

\'/api/auth\',

\'/api/webhooks/stripe\',

\'/\_next\',

\'/favicon.ico\'

\];

const isPublicRoute = publicRoutes.some(route =\>
pathname.startsWith(route));

if (isPublicRoute) {

return NextResponse.next();

}

// Routes protégées par le dashboard

if (pathname.startsWith(\'/dashboard\')) {

return trialCheckMiddleware(req);

}

return NextResponse.next();

}

export const config = {

matcher: \[

/\*

\* Match all request paths except for the ones starting with:

\* - \_next/static (static files)

\* - \_next/image (image optimization files)

\* - favicon.ico (favicon file)

\*/

\'/((?!\_next/static\|\_next/image\|favicon.ico).\*)\',

\],

};

**3.3 Middleware pour l\'API Agent IA**

**Fichier** : middleware/api-auth.ts

**Action** : Modifier la fonction verifyApiToken pour inclure la
vérification du trial

import { TrialService } from \'@/lib/trial/TrialService\';

export async function verifyApiToken(

req: NextRequest,

requiredScopes: string\[\] = \[\]

): Promise\<{

valid: boolean;

payload?: any;

error?: string;

}\> {

// \... code existant de vérification du token JWT

// AJOUTER APRÈS LA VÉRIFICATION DU TOKEN :

// Vérifier l\'accès (trial ou subscription)

const accessCheck = await TrialService.hasAccess(payload.userId);

if (!accessCheck.hasAccess) {

return {

valid: false,

error: accessCheck.reason \|\| \'Accès expiré. Abonnez-vous pour
continuer.\'

};

}

// Si trial actif, ajouter info dans le payload

if (accessCheck.status === \'trial_active\') {

payload.trialDaysLeft = accessCheck.trialDaysLeft;

}

return {

valid: true,

payload

};

}

**Phase 4 : Hook d\'initialisation du trial**

**4.1 Initialiser le trial à l\'inscription**

**Fichier** : app/api/auth/register/route.ts (ou votre endpoint
d\'inscription)

**Action** : Ajouter l\'initialisation du trial après la création de
l\'utilisateur

import { TrialService } from \'@/lib/trial/TrialService\';

export async function POST(req: Request) {

// \... code existant de création d\'utilisateur

const user = await prisma.user.create({

data: {

email,

password: hashedPassword,

name

}

});

// AJOUTER : Initialiser le trial

await TrialService.initializeTrial(user.id);

// \... reste du code (envoi email de bienvenue, etc.)

return NextResponse.json({

user,

message: \'Compte créé avec succès ! Profitez de 7 jours d\\\'essai
gratuit.\'

});

}

**4.2 Initialiser le trial pour OAuth (Google/Apple)**

**Fichier** : Configuration NextAuth - lib/auth.ts ou
app/api/auth/\[\...nextauth\]/route.ts

**Action** : Ajouter un callback signIn

import { TrialService } from \'@/lib/trial/TrialService\';

export const authOptions = {

// \... config existante

callbacks: {

async signIn({ user, account, profile }) {

// Si c\'est la première connexion (nouveau compte)

if (account?.provider && user?.id) {

const existingUser = await prisma.user.findUnique({

where: { id: user.id },

select: { trialStartDate: true }

});

// Si pas de trial déjà initialisé

if (existingUser && !existingUser.trialStartDate) {

await TrialService.initializeTrial(user.id);

}

}

return true;

},

// \... autres callbacks

}

};

**Phase 5 : Page d\'upgrade/abonnement**

**5.1 Créer la page d\'upgrade**

**Fichier** : app/upgrade/page.tsx

**Action** : Créer le fichier

import { getServerSession } from \'next-auth\';

import { authOptions } from \'@/lib/auth\';

import { redirect } from \'next/navigation\';

import { TrialService } from \'@/lib/trial/TrialService\';

import { PricingPlans } from \'@/components/upgrade/PricingPlans\';

export default async function UpgradePage() {

const session = await getServerSession(authOptions);

if (!session?.user?.id) {

redirect(\'/login\');

}

const accessCheck = await TrialService.hasAccess(session.user.id);

return (

\<div className=\"min-h-screen bg-gray-50 py-12\"\>

\<div className=\"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8\"\>

\<div className=\"text-center mb-12\"\>

\<h1 className=\"text-4xl font-bold text-gray-900 mb-4\"\>

{accessCheck.status === \'trial_expired\'

? \'🚀 Votre période d\\\'essai est terminée\'

: \'⚡ Passez à la vitesse supérieure\'

}

\</h1\>

{accessCheck.status === \'trial_active\' && (

\<p className=\"text-lg text-gray-600\"\>

Il vous reste {accessCheck.trialDaysLeft} jour(s) d\'essai gratuit

\</p\>

)}

{accessCheck.status === \'trial_expired\' && (

\<p className=\"text-lg text-gray-600\"\>

Continuez votre productivité avec un abonnement

\</p\>

)}

\</div\>

\<PricingPlans userId={session.user.id} /\>

\</div\>

\</div\>

);

}

**5.2 Composant de pricing**

**Fichier** : components/upgrade/PricingPlans.tsx

**Action** : Créer le composant

\'use client\';

import { useState } from \'react\';

import { loadStripe } from \'@stripe/stripe-js\';

const stripePromise =
loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const plans = \[

{

id: \'starter\',

name: \'Starter\',

price: 9.99,

features: \[

\'Tâches illimitées\',

\'Agent IA WhatsApp\',

\'Sessions Deep Work\',

\'Suivi d\\\'habitudes\',

\'Support par email\'

\]

},

{

id: \'pro\',

name: \'Pro\',

price: 19.99,

popular: true,

features: \[

\'Tout de Starter\',

\'Objectifs OKR avancés\',

\'Analytics détaillés\',

\'Intégrations (Notion, Google Cal)\',

\'Support prioritaire\',

\'Export de données\'

\]

},

{

id: \'enterprise\',

name: \'Enterprise\',

price: 49.99,

features: \[

\'Tout de Pro\',

\'Gestion d\\\'équipe\',

\'API personnalisée\',

\'Onboarding dédié\',

\'Support 24/7\',

\'SLA garanti\'

\]

}

\];

export function PricingPlans({ userId }: { userId: string }) {

const \[loading, setLoading\] = useState\<string \| null\>(null);

const handleSubscribe = async (planId: string) =\> {

setLoading(planId);

try {

const response = await fetch(\'/api/stripe/create-checkout-session\', {

method: \'POST\',

headers: { \'Content-Type\': \'application/json\' },

body: JSON.stringify({ planId, userId })

});

const { sessionId } = await response.json();

const stripe = await stripePromise;

if (stripe) {

await stripe.redirectToCheckout({ sessionId });

}

} catch (error) {

console.error(\'Erreur:\', error);

alert(\'Erreur lors de la souscription. Réessayez.\');

} finally {

setLoading(null);

}

};

return (

\<div className=\"grid grid-cols-1 md:grid-cols-3 gap-8\"\>

{plans.map((plan) =\> (

\<div

key={plan.id}

className={\`relative bg-white rounded-2xl shadow-lg p-8 \${

plan.popular ? \'ring-2 ring-blue-500\' : \'\'

}\`}

\>

{plan.popular && (

\<div className=\"absolute -top-4 left-1/2 -translate-x-1/2\"\>

\<span className=\"bg-blue-500 text-white px-4 py-1 rounded-full text-sm
font-medium\"\>

Le plus populaire

\</span\>

\</div\>

)}

\<h3 className=\"text-2xl font-bold text-gray-900
mb-2\"\>{plan.name}\</h3\>

\<div className=\"mb-6\"\>

\<span className=\"text-4xl font-bold
text-gray-900\"\>{plan.price}€\</span\>

\<span className=\"text-gray-600\"\>/mois\</span\>

\</div\>

\<ul className=\"space-y-4 mb-8\"\>

{plan.features.map((feature, idx) =\> (

\<li key={idx} className=\"flex items-start\"\>

\<svg

className=\"w-5 h-5 text-green-500 mr-3 mt-0.5\"

fill=\"none\"

stroke=\"currentColor\"

viewBox=\"0 0 24 24\"

\>

\<path

strokeLinecap=\"round\"

strokeLinejoin=\"round\"

strokeWidth={2}

d=\"M5 13l4 4L19 7\"

/\>

\</svg\>

\<span className=\"text-gray-700\"\>{feature}\</span\>

\</li\>

))}

\</ul\>

\<button

onClick={() =\> handleSubscribe(plan.id)}

disabled={loading === plan.id}

className={\`w-full py-3 px-6 rounded-lg font-medium transition-colors
\${

plan.popular

? \'bg-blue-500 hover:bg-blue-600 text-white\'

: \'bg-gray-100 hover:bg-gray-200 text-gray-900\'

} disabled:opacity-50 disabled:cursor-not-allowed\`}

\>

{loading === plan.id ? \'Chargement\...\' : \'S\\\'abonner\'}

\</button\>

\</div\>

))}

\</div\>

);

}

**Phase 6 : Intégration Stripe**

**6.1 Créer la session de checkout**

**Fichier** : app/api/stripe/create-checkout-session/route.ts

**Action** : Créer le fichier

import { NextRequest, NextResponse } from \'next/server\';

import Stripe from \'stripe\';

import { getServerSession } from \'next-auth\';

import { authOptions } from \'@/lib/auth\';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {

apiVersion: \'2023-10-16\'

});

const PRICE_IDS = {

starter: process.env.STRIPE_PRICE_ID_STARTER!,

pro: process.env.STRIPE_PRICE_ID_PRO!,

enterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE!

};

export async function POST(req: NextRequest) {

try {

const session = await getServerSession(authOptions);

if (!session?.user?.email) {

return NextResponse.json({ error: \'Non authentifié\' }, { status: 401
});

}

const { planId } = await req.json();

if (!PRICE_IDS\[planId as keyof typeof PRICE_IDS\]) {

return NextResponse.json({ error: \'Plan invalide\' }, { status: 400 });

}

const checkoutSession = await stripe.checkout.sessions.create({

mode: \'subscription\',

payment_method_types: \[\'card\'\],

line_items: \[

{

price: PRICE_IDS\[planId as keyof typeof PRICE_IDS\],

quantity: 1

}

\],

success_url:
\`\${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success\`,

cancel_url:
\`\${process.env.NEXT_PUBLIC_APP_URL}/upgrade?cancelled=true\`,

customer_email: session.user.email,

metadata: {

userId: session.user.id,

planId

}

});

return NextResponse.json({ sessionId: checkoutSession.id });

} catch (error) {

console.error(\'Erreur création session Stripe:\', error);

return NextResponse.json({ error: \'Erreur serveur\' }, { status: 500
});

}

}

**6.2 Webhook Stripe pour activer l\'abonnement**

**Fichier** : app/api/webhooks/stripe/route.ts

**Action** : Créer ou modifier le webhook

import { NextRequest, NextResponse } from \'next/server\';

import Stripe from \'stripe\';

import { TrialService } from \'@/lib/trial/TrialService\';

import prisma from \'@/lib/prisma\';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {

apiVersion: \'2023-10-16\'

});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {

const body = await req.text();

const signature = req.headers.get(\'stripe-signature\')!;

let event: Stripe.Event;

try {

event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

} catch (err) {

console.error(\'Webhook signature verification failed:\', err);

return NextResponse.json({ error: \'Invalid signature\' }, { status: 400
});

}

try {

switch (event.type) {

case \'checkout.session.completed\': {

const session = event.data.object as Stripe.Checkout.Session;

if (session.mode === \'subscription\') {

const userId = session.metadata?.userId;

const planId = session.metadata?.planId;

if (userId && planId) {

// Récupérer la subscription

const subscription = await stripe.subscriptions.retrieve(

session.subscription as string

);

// Convertir le trial en subscription

await TrialService.convertTrialToSubscription(

userId,

session.customer as string,

subscription.id,

planId

);

console.log(\`✅ Subscription activée pour user \${userId}\`);

}

}

break;

}

case \'customer.subscription.updated\': {

const subscription = event.data.object as Stripe.Subscription;

// Mettre à jour le statut si annulation programmée

if (subscription.cancel_at_period_end) {

await prisma.user.update({

where: { stripeSubscriptionId: subscription.id },

data: {

subscriptionStatus: \'cancelled\',

cancelledAt: new Date()

}

});

}

break;

}

case \'customer.subscription.deleted\': {

const subscription = event.data.object as Stripe.Subscription;

// Désactiver l\'accès

await prisma.user.update({

where: { stripeSubscriptionId: subscription.id },

data: {

subscriptionStatus: \'expired\',

subscriptionEndDate: new Date()

}

});

console.log(\`❌ Subscription expirée: \${subscription.id}\`);

break;

}

}

return NextResponse.json({ received: true });

} catch (error) {

console.error(\'Erreur traitement webhook:\', error);

return NextResponse.json({ error: \'Webhook handler failed\' }, {
status: 500 });

}

}

**Phase 7 : Notifications et rappels**

**7.1 Scheduler pour les rappels de trial**

**Fichier** : lib/trial/TrialReminderScheduler.ts

**Action** : Créer le fichier

import cron from \'node-cron\';

import { TrialService } from \'./TrialService\';

import { sendWhatsAppMessage } from \'@/lib/whatsapp\';

import { sendEmail } from \'@/lib/email\';

export class TrialReminderScheduler {

private cronJob: cron.ScheduledTask \| null = null;

start() {

// Vérifier tous les jours à 10h00

this.cronJob = cron.schedule(\'0 10 \* \* \*\', async () =\> {

await this.checkAndSendReminders();

}, {

timezone: \'Europe/Paris\'

});

console.log(\'✅ TrialReminderScheduler démarré (vérification
quotidienne à 10h)\');

}

stop() {

if (this.cronJob) {

this.cronJob.stop();

console.log(\'⏹️ TrialReminderScheduler arrêté\');

}

}

private async checkAndSendReminders() {

try {

// Rappel 3 jours avant expiration

await this.sendReminderForDay(3, \'reminder_3days\');

// Rappel 1 jour avant expiration

await this.sendReminderForDay(1, \'reminder_1day\');

// Notification d\'expiration (jour J)

await this.sendExpirationNotifications();

} catch (error) {

console.error(\'❌ Erreur envoi rappels trial:\', error);

}

}

private async sendReminderForDay(daysLeft: number, type: string) {

const users = await TrialService.getUsersWithExpiringTrial(daysLeft);

console.log(\`📧 \${users.length} utilisateur(s) à notifier
(\${daysLeft} jours restants)\`);

for (const user of users) {

try {

// Vérifier si déjà notifié

const alreadySent = await TrialService.hasNotificationBeenSent(user.id,
type);

if (alreadySent) continue;

// Email

if (user.email) {

await this.sendReminderEmail(user, daysLeft);

await TrialService.recordNotificationSent(user.id, type, \'email\');

}

// WhatsApp

if (user.notificationPreferences?.whatsappEnabled &&
user.notificationPreferences?.whatsappNumber) {

await this.sendReminderWhatsApp(user, daysLeft);

await TrialService.recordNotificationSent(user.id, type, \'whatsapp\');

}

console.log(\`✅ Rappel \${daysLeft}j envoyé à \${user.email}\`);

} catch (error) {

console.error(\`❌ Erreur envoi rappel à \${user.id}:\`, error);

}

}

}

private async sendExpirationNotifications() {

const users = await TrialService.getUsersWithExpiringTrial(0);

console.log(\`🚨 \${users.length} trial(s) expire(nt) aujourd\'hui\`);

for (const user of users) {

try {

const alreadySent = await TrialService.hasNotificationBeenSent(user.id,
\'expired\');

if (alreadySent) continue;

// Email d\'expiration

if (user.email) {

await this.sendExpirationEmail(user);

await TrialService.recordNotificationSent(user.id, \'expired\',
\'email\');

}

// WhatsApp

if (user.notificationPreferences?.whatsappEnabled &&
user.notificationPreferences?.whatsappNumber) {

await this.sendExpirationWhatsApp(user);

await TrialService.recordNotificationSent(user.id, \'expired\',
\'whatsapp\');

}

// Marquer le trial comme expiré

await TrialService.expireTrial(user.id);

} catch (error) {

console.error(\`❌ Erreur notification expiration pour \${user.id}:\`,
error);

}

}

}

private async sendReminderEmail(user: any, daysLeft: number) {

const subject = \`⏰ Plus que \${daysLeft} jour\${daysLeft \> 1 ? \'s\'
: \'\'} d\'essai gratuit !\`;

const html = \`

\<h2\>Bonjour \${user.name \|\| \'utilisateur\'},\</h2\>

\<p\>Votre période d\'essai gratuite expire dans \<strong\>\${daysLeft}
jour\${daysLeft \> 1 ? \'s\' : \'\'}\</strong\> !\</p\>

\<p\>Pour continuer à profiter de Productif.io sans interruption :\</p\>

\<ul\>

\<li\>✅ Sessions Deep Work illimitées\</li\>

\<li\>✅ Agent IA WhatsApp 24/7\</li\>

\<li\>✅ Suivi d\'habitudes avancé\</li\>

\<li\>✅ Objectifs OKR et analytics\</li\>

\</ul\>

\<p style=\"margin: 30px 0;\"\>

\<a href=\"\${process.env.NEXT_PUBLIC_APP_URL}/upgrade\"

style=\"background: #3B82F6; color: white; padding: 12px 24px;
text-decoration: none; border-radius: 8px; display: inline-block;\"\>

🚀 Choisir mon abonnement

\</a\>

\</p\>

\<p\>À très bientôt,\<br\>L\'équipe Productif.io\</p\>

\`;

await sendEmail({

to: user.email,

subject,

html

});

}

private async sendReminderWhatsApp(user: any, daysLeft: number) {

const message = \`⏰ \*Rappel Productif.io\*\\n\\nTon essai gratuit
expire dans \*\${daysLeft} jour\${daysLeft \> 1 ? \'s\' : \'\'}\*
!\\n\\n💡 Pour continuer sans interruption, choisis ton abonnement
:\\n\${process.env.NEXT_PUBLIC_APP_URL}/upgrade\\n\\n✨ Tu vas adorer la
version complète !\`;

await sendWhatsAppMessage(user.notificationPreferences.whatsappNumber,
message);

}

private async sendExpirationEmail(user: any) {

const subject = \'🚨 Votre essai gratuit est terminé\';

const html = \`

\<h2\>Bonjour \${user.name \|\| \'utilisateur\'},\</h2\>

\<p\>Votre période d\'essai gratuite de 7 jours est maintenant
\<strong\>terminée\</strong\>.\</p\>

\<p\>Nous espérons que vous avez apprécié Productif.io ! 🎉\</p\>

\<p\>\<strong\>Pour continuer à utiliser l\'application
:\</strong\>\</p\>

\<p style=\"margin: 30px 0;\"\>

\<a href=\"\${process.env.NEXT_PUBLIC_APP_URL}/upgrade\"

style=\"background: #3B82F6; color: white; padding: 12px 24px;
text-decoration: none; border-radius: 8px; display: inline-block;
font-size: 16px;\"\>

🚀 S\'abonner maintenant

\</a\>

\</p\>

\<p\>Offre spéciale : \<strong\>-20% sur votre premier mois\</strong\>
avec le code \<code\>WELCOME20\</code\>\</p\>

\<p\>Merci de nous avoir fait confiance,\<br\>L\'équipe
Productif.io\</p\>

\`;

await sendEmail({

to: user.email,

subject,

html

});

}

private async sendExpirationWhatsApp(user: any) {

const message = \`🚨 \*Ton essai est terminé\*\\n\\nTa période d\'essai
gratuite de 7 jours est maintenant terminée.\\n\\n🎉 \*Offre spéciale
:\* -20% sur ton premier mois avec le code \*WELCOME20\*\\n\\n👉 Choisis
ton abonnement ici
:\\n\${process.env.NEXT_PUBLIC_APP_URL}/upgrade\\n\\nMerci de nous avoir
fait confiance ! 💙\`;

await sendWhatsAppMessage(user.notificationPreferences.whatsappNumber,
message);

}

}

export const trialReminderScheduler = new TrialReminderScheduler();

**7.2 Intégrer au scheduler principal**

**Fichier** : lib/ReactiveSchedulerManager.js

**Action** : Ajouter l\'import et le démarrage

import { trialReminderScheduler } from
\'./trial/TrialReminderScheduler\';

// Dans la méthode start()

async start() {

// \... code existant

// Démarrer le TrialReminderScheduler

trialReminderScheduler.start();

// \... reste du code

}

// Dans la méthode stop()

async stop() {

// \... code existant

// Arrêter le TrialReminderScheduler

trialReminderScheduler.stop();

// \... reste du code

}

**Phase 8 : UI/UX - Bannière de rappel**

**8.1 Composant de bannière trial**

**Fichier** : components/trial/TrialBanner.tsx

**Action** : Créer le composant

\'use client\';

import { useEffect, useState } from \'react\';

import Link from \'next/link\';

import { X } from \'lucide-react\';

export function TrialBanner() {

const \[visible, setVisible\] = useState(false);

const \[daysLeft, setDaysLeft\] = useState\<number \| null\>(null);

const \[dismissed, setDismissed\] = useState(false);

useEffect(() =\> {

// Récupérer les infos du trial depuis l\'API

fetch(\'/api/user/trial-status\')

.then(res =\> res.json())

.then(data =\> {

if (data.status === \'trial_active\' && data.daysLeft !== undefined) {

setDaysLeft(data.daysLeft);

// Afficher la bannière seulement si \< 4 jours restants

if (data.daysLeft \<= 3) {

const dismissed = localStorage.getItem(\'trial-banner-dismissed\');

if (!dismissed \|\| Date.now() - parseInt(dismissed) \> 24 \* 60 \* 60
\* 1000) {

setVisible(true);

}

}

}

})

.catch(console.error);

}, \[\]);

const handleDismiss = () =\> {

setVisible(false);

setDismissed(true);

localStorage.setItem(\'trial-banner-dismissed\', Date.now().toString());

};

if (!visible \|\| dismissed \|\| daysLeft === null) return null;

const isUrgent = daysLeft \<= 1;

const bgColor = isUrgent ? \'bg-red-500\' : \'bg-blue-500\';

return (

\<div className={\`\${bgColor} text-white py-3 px-4 relative\`}\>

\<div className=\"max-w-7xl mx-auto flex items-center
justify-between\"\>

\<div className=\"flex items-center gap-4 flex-1\"\>

\<span className=\"text-2xl\"\>{isUrgent ? \'🚨\' : \'⏰\'}\</span\>

\<div\>

\<p className=\"font-medium\"\>

{daysLeft === 0 && \"Votre essai gratuit expire aujourd\'hui !\"}

{daysLeft === 1 && \"Plus qu\'1 jour d\'essai gratuit\"}

{daysLeft \> 1 && \`Plus que \${daysLeft} jours d\'essai gratuit\`}

\</p\>

\<p className=\"text-sm opacity-90\"\>

Abonnez-vous maintenant pour continuer sans interruption

\</p\>

\</div\>

\</div\>

\<div className=\"flex items-center gap-3\"\>

\<Link

href=\"/upgrade\"

className=\"bg-white text-gray-900 px-4 py-2 rounded-lg font-medium
hover:bg-gray-100 transition-colors\"

\>

Choisir mon abonnement

\</Link\>

\<button

onClick={handleDismiss}

className=\"p-1 hover:bg-white/20 rounded transition-colors\"

aria-label=\"Fermer\"

\>

\<X size={20} /\>

\</button\>

\</div\>

\</div\>

\</div\>

);

}

**8.2 API endpoint pour le statut du trial**

**Fichier** : app/api/user/trial-status/route.ts

**Action** : Créer le fichier

import { NextRequest, NextResponse } from \'next/server\';

import { getServerSession } from \'next-auth\';

import { authOptions } from \'@/lib/auth\';

import { TrialService } from \'@/lib/trial/TrialService\';

export async function GET(req: NextRequest) {

try {

const session = await getServerSession(authOptions);

if (!session?.user?.id) {

return NextResponse.json({ error: \'Non authentifié\' }, { status: 401
});

}

const accessCheck = await TrialService.hasAccess(session.user.id);

return NextResponse.json({

status: accessCheck.status,

daysLeft: accessCheck.trialDaysLeft,

hasAccess: accessCheck.hasAccess

});

} catch (error) {

console.error(\'Erreur récupération statut trial:\', error);

return NextResponse.json({ error: \'Erreur serveur\' }, { status: 500
});

}

}

**8.3 Intégrer la bannière dans le layout**

**Fichier** : app/dashboard/layout.tsx

**Action** : Ajouter la bannière

import { TrialBanner } from \'@/components/trial/TrialBanner\';

export default function DashboardLayout({

children,

}: {

children: React.ReactNode;

}) {

return (

\<div className=\"min-h-screen bg-gray-50\"\>

\<TrialBanner /\>

{/\* Reste du layout existant \*/}

\<div className=\"flex\"\>

{/\* Sidebar, header, etc. \*/}

\<main className=\"flex-1\"\>

{children}

\</main\>

\</div\>

\</div\>

);

}

**Phase 9 : Message d\'erreur pour l\'agent IA**

**9.1 Améliorer le message d\'erreur WhatsApp**

**Fichier** : middleware/api-auth.ts

**Action** : Personnaliser le message d\'erreur lors du blocage

export async function verifyApiToken(

req: NextRequest,

requiredScopes: string\[\] = \[\]

): Promise\<{

valid: boolean;

payload?: any;

error?: string;

errorType?: string;

}\> {

// \... code de vérification JWT existant

// Vérifier l\'accès

const accessCheck = await TrialService.hasAccess(payload.userId);

if (!accessCheck.hasAccess) {

return {

valid: false,

error: accessCheck.status === \'trial_expired\'

? \'🚨 Ton essai gratuit est terminé ! Abonne-toi pour continuer : \' +
process.env.NEXT_PUBLIC_APP_URL + \'/upgrade\'

: \'Accès expiré. Abonnez-vous pour continuer.\',

errorType: \'TRIAL_EXPIRED\'

};

}

return {

valid: true,

payload

};

}

**9.2 Handler spécifique dans le webhook WhatsApp**

**Fichier** : app/api/webhooks/whatsapp/route.ts

**Action** : Gérer l\'erreur d\'expiration

export async function POST(req: Request) {

// \... code existant

// Après récupération du token API

const apiToken = await getOrCreateApiToken(userId);

// Vérifier l\'accès avant de traiter les commandes

const accessCheck = await TrialService.hasAccess(userId);

if (!accessCheck.hasAccess) {

// Message personnalisé selon le statut

let message = \'🚨 \*Ton essai gratuit est terminé !\*\\n\\n\';

message += \'Pour continuer à utiliser Productif.io :\\n\\n\';

message += \`👉 \${process.env.NEXT_PUBLIC_APP_URL}/upgrade\\n\\n\`;

message += \'💡 \*Offre spéciale :\* -20% avec le code
\*WELCOME20\*\\n\\n\';

message += \'À très bientôt ! 💙\';

await sendWhatsAppMessage(phoneNumber, message);

return new NextResponse(\'OK\', { status: 200 });

}

// Afficher un rappel si trial actif avec peu de jours restants

if (accessCheck.status === \'trial_active\' && accessCheck.trialDaysLeft
!== undefined && accessCheck.trialDaysLeft \<= 2) {

// Envoyer un rappel discret une fois par jour

const lastReminderKey = \`trial-reminder-\${userId}-\${new
Date().toDateString()}\`;

const alreadyReminded = await redis.get(lastReminderKey); // Si vous
utilisez Redis

if (!alreadyReminded) {

let reminderMessage = \`⏰ \*Rappel :\* Plus que
\${accessCheck.trialDaysLeft} jour\${accessCheck.trialDaysLeft \> 1 ?
\'s\' : \'\'} d\'essai gratuit !\\n\\n\`;

reminderMessage += \`Pense à t\'abonner :
\${process.env.NEXT_PUBLIC_APP_URL}/upgrade\`;

await sendWhatsAppMessage(phoneNumber, reminderMessage);

// await redis.set(lastReminderKey, \'1\', \'EX\', 86400); // Expire
dans 24h

}

}

// \... reste du code de traitement des commandes

}

**Phase 10 : Dashboard admin - Monitoring des trials**

**10.1 Page admin des trials**

**Fichier** : app/dashboard/admin/trials/page.tsx

**Action** : Créer la page

import { getServerSession } from \'next-auth\';

import { authOptions } from \'@/lib/auth\';

import { redirect } from \'next/navigation\';

import { TrialService } from \'@/lib/trial/TrialService\';

import prisma from \'@/lib/prisma\';

export default async function TrialsAdminPage() {

const session = await getServerSession(authOptions);

// Vérifier que l\'utilisateur est admin

if (!session?.user?.role \|\| session.user.role !== \'admin\') {

redirect(\'/dashboard\');

}

// Récupérer les statistiques

const stats = await TrialService.getTrialStats();

// Récupérer les utilisateurs en trial actif

const activeTrialUsers = await prisma.user.findMany({

where: {

subscriptionStatus: \'trial\',

trialStatus: \'active\'

},

select: {

id: true,

name: true,

email: true,

trialStartDate: true,

trialEndDate: true,

createdAt: true

},

orderBy: {

trialEndDate: \'asc\'

},

take: 50

});

// Calculer les jours restants

const usersWithDaysLeft = activeTrialUsers.map(user =\> ({

\...user,

daysLeft: user.trialEndDate

? Math.ceil((user.trialEndDate.getTime() - Date.now()) / (24 \* 60 \* 60
\* 1000))

: 0

}));

return (

\<div className=\"p-8\"\>

\<h1 className=\"text-3xl font-bold mb-8\"\>Gestion des Trials\</h1\>

{/\* Statistiques globales \*/}

\<div className=\"grid grid-cols-1 md:grid-cols-4 gap-6 mb-8\"\>

\<div className=\"bg-white rounded-lg shadow p-6\"\>

\<div className=\"text-sm text-gray-600 mb-2\"\>Trials actifs\</div\>

\<div className=\"text-3xl font-bold
text-blue-600\"\>{stats.activeTrials}\</div\>

\</div\>

\<div className=\"bg-white rounded-lg shadow p-6\"\>

\<div className=\"text-sm text-gray-600 mb-2\"\>Trials expirés\</div\>

\<div className=\"text-3xl font-bold
text-red-600\"\>{stats.expiredTrials}\</div\>

\</div\>

\<div className=\"bg-white rounded-lg shadow p-6\"\>

\<div className=\"text-sm text-gray-600 mb-2\"\>Conversions\</div\>

\<div className=\"text-3xl font-bold
text-green-600\"\>{stats.convertedTrials}\</div\>

\</div\>

\<div className=\"bg-white rounded-lg shadow p-6\"\>

\<div className=\"text-sm text-gray-600 mb-2\"\>Taux de
conversion\</div\>

\<div className=\"text-3xl font-bold text-purple-600\"\>

{stats.conversionRate.toFixed(1)}%

\</div\>

\</div\>

\</div\>

{/\* Liste des utilisateurs en trial \*/}

\<div className=\"bg-white rounded-lg shadow\"\>

\<div className=\"p-6 border-b border-gray-200\"\>

\<h2 className=\"text-xl font-semibold\"\>Utilisateurs en trial
actif\</h2\>

\</div\>

\<div className=\"overflow-x-auto\"\>

\<table className=\"w-full\"\>

\<thead className=\"bg-gray-50\"\>

\<tr\>

\<th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500
uppercase\"\>

Utilisateur

\</th\>

\<th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500
uppercase\"\>

Email

\</th\>

\<th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500
uppercase\"\>

Inscrit le

\</th\>

\<th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500
uppercase\"\>

Expire le

\</th\>

\<th className=\"px-6 py-3 text-left text-xs font-medium text-gray-500
uppercase\"\>

Jours restants

\</th\>

\</tr\>

\</thead\>

\<tbody className=\"bg-white divide-y divide-gray-200\"\>

{usersWithDaysLeft.map((user) =\> (

\<tr key={user.id}\>

\<td className=\"px-6 py-4 whitespace-nowrap\"\>

\<div className=\"font-medium text-gray-900\"\>{user.name \|\| \'Sans
nom\'}\</div\>

\</td\>

\<td className=\"px-6 py-4 whitespace-nowrap\"\>

\<div className=\"text-sm text-gray-500\"\>{user.email}\</div\>

\</td\>

\<td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\"\>

{user.createdAt.toLocaleDateString(\'fr-FR\')}

\</td\>

\<td className=\"px-6 py-4 whitespace-nowrap text-sm text-gray-500\"\>

{user.trialEndDate?.toLocaleDateString(\'fr-FR\')}

\</td\>

\<td className=\"px-6 py-4 whitespace-nowrap\"\>

\<span

className={\`px-2 py-1 text-xs font-semibold rounded-full \${

user.daysLeft \<= 1

? \'bg-red-100 text-red-800\'

: user.daysLeft \<= 3

? \'bg-yellow-100 text-yellow-800\'

: \'bg-green-100 text-green-800\'

}\`}

\>

{user.daysLeft} jour{user.daysLeft \> 1 ? \'s\' : \'\'}

\</span\>

\</td\>

\</tr\>

))}

\</tbody\>

\</table\>

\</div\>

\</div\>

\</div\>

);

}

**Phase 11 : Tests et validation**

**11.1 Tests manuels à effectuer**

**Test 1 : Inscription et initialisation du trial**

1.  S\'inscrire avec un nouveau compte

2.  Vérifier en BDD que trialStartDate, trialEndDate,
    trialStatus=\'active\' sont créés

3.  Vérifier que trialEndDate = trialStartDate + 7 jours

**Requête SQL** :

SELECT id, email, \"trialStartDate\", \"trialEndDate\", \"trialStatus\",
\"subscriptionStatus\"

FROM \"User\"

WHERE email = \'test@example.com\';

**Test 2 : Accès pendant le trial**

1.  Se connecter avec un compte en trial actif

2.  Vérifier l\'accès au dashboard

3.  Tester l\'agent IA WhatsApp

4.  Vérifier qu\'aucun message d\'erreur n\'apparaît

**Test 3 : Bannière de rappel**

1.  Modifier en BDD trialEndDate pour qu\'il reste 2 jours

2.  Recharger le dashboard

3.  Vérifier que la bannière bleue apparaît en haut

4.  Cliquer sur \"Fermer\" et vérifier qu\'elle disparaît

5.  Recharger la page : elle ne doit pas réapparaître avant 24h

**Test 4 : Expiration du trial**

1.  Modifier en BDD trialEndDate pour une date passée

2.  Essayer d\'accéder au dashboard

3.  **Résultat attendu** : Redirection vers /upgrade

4.  Essayer d\'utiliser l\'agent IA WhatsApp

5.  **Résultat attendu** : Message \"Ton essai gratuit est terminé\...\"

**Test 5 : Abonnement Stripe**

1.  Aller sur /upgrade

2.  Cliquer sur \"S\'abonner\" pour un plan

3.  Compléter le paiement test Stripe (carte 4242 4242 4242 4242)

4.  Vérifier la redirection vers /dashboard?subscription=success

5.  Vérifier en BDD que :

    -   subscriptionStatus = \'active\'

    -   trialStatus = \'converted\'

    -   stripeCustomerId et stripeSubscriptionId sont remplis

**Test 6 : Accès après abonnement**

1.  Avec un compte abonné, accéder au dashboard

2.  Utiliser l\'agent IA

3.  Vérifier qu\'aucun message de trial n\'apparaît

**Test 7 : Notifications de rappel**

**Option A : Test manuel rapide**

1.  Modifier en BDD plusieurs utilisateurs avec trialEndDate dans 3
    jours

2.  Exécuter manuellement le scheduler :

import { trialReminderScheduler } from
\'@/lib/trial/TrialReminderScheduler\';

await trialReminderScheduler.checkAndSendReminders();

3.  Vérifier réception des emails/WhatsApp

**Option B : Test automatique**

1.  Attendre l\'exécution quotidienne (10h)

2.  Vérifier les logs

**11.2 Tests automatisés (optionnels mais recommandés)**

**Fichier** : \_\_tests\_\_/trial.test.ts

import { TrialService } from \'@/lib/trial/TrialService\';

import prisma from \'@/lib/prisma\';

describe(\'TrialService\', () =\> {

let testUserId: string;

beforeAll(async () =\> {

// Créer un utilisateur test

const user = await prisma.user.create({

data: {

email: \'trial-test@example.com\',

password: \'test123\',

name: \'Test User\'

}

});

testUserId = user.id;

});

afterAll(async () =\> {

// Nettoyer

await prisma.user.delete({

where: { id: testUserId }

});

});

test(\'initializeTrial doit créer un trial de 7 jours\', async () =\> {

await TrialService.initializeTrial(testUserId);

const user = await prisma.user.findUnique({

where: { id: testUserId }

});

expect(user?.trialStatus).toBe(\'active\');

expect(user?.subscriptionStatus).toBe(\'trial\');

expect(user?.trialStartDate).toBeDefined();

expect(user?.trialEndDate).toBeDefined();

const daysDiff = Math.ceil(

(user!.trialEndDate!.getTime() - user!.trialStartDate!.getTime()) / (24
\* 60 \* 60 \* 1000)

);

expect(daysDiff).toBe(7);

});

test(\'hasAccess doit retourner true pendant le trial\', async () =\> {

const result = await TrialService.hasAccess(testUserId);

expect(result.hasAccess).toBe(true);

expect(result.status).toBe(\'trial_active\');

expect(result.trialDaysLeft).toBeGreaterThan(0);

});

test(\'hasAccess doit retourner false après expiration\', async () =\> {

// Forcer l\'expiration

await prisma.user.update({

where: { id: testUserId },

data: {

trialEndDate: new Date(Date.now() - 24 \* 60 \* 60 \* 1000) // Hier

}

});

const result = await TrialService.hasAccess(testUserId);

expect(result.hasAccess).toBe(false);

expect(result.status).toBe(\'trial_expired\');

});

});

**Phase 12 : Déploiement**

**12.1 Checklist pré-déploiement**

**Base de données**

-   \[ \] Backup de la base de données

-   \[ \] Migration Prisma : npx prisma migrate deploy

-   \[ \] Vérifier tables créées : TrialNotification

-   \[ \] Vérifier colonnes ajoutées dans User

**Variables d\'environnement**

-   \[ \] STRIPE_SECRET_KEY

-   \[ \] STRIPE_PUBLISHABLE_KEY

-   \[ \] STRIPE_WEBHOOK_SECRET

-   \[ \] STRIPE_PRICE_ID_STARTER

-   \[ \] STRIPE_PRICE_ID_PRO

-   \[ \] STRIPE_PRICE_ID_ENTERPRISE

-   \[ \] NEXT_PUBLIC_APP_URL

**Stripe Configuration**

-   \[ \] Créer les produits dans Stripe Dashboard

-   \[ \] Créer les prix (Price IDs)

-   \[ \] Configurer le webhook endpoint :
    https://votre-app.com/api/webhooks/stripe

-   \[ \] Événements à écouter :

    -   checkout.session.completed

    -   customer.subscription.updated

    -   customer.subscription.deleted

-   \[ \] Tester en mode test avant production

**Code**

-   \[ \] Tous les fichiers créés et commitées

-   \[ \] Tests manuels effectués en local

-   \[ \] Scheduler trial intégré et testé

**12.2 Migration des utilisateurs existants**

**Script de migration** : scripts/migrate-existing-users-to-trial.ts

import prisma from \'../lib/prisma\';

import { TrialService } from \'../lib/trial/TrialService\';

async function migrateExistingUsers() {

console.log(\'🔄 Migration des utilisateurs existants vers le système de
trial\...\');

const users = await prisma.user.findMany({

where: {

trialStartDate: null

}

});

console.log(\`📊 \${users.length} utilisateur(s) à migrer\`);

for (const user of users) {

try {

// Option 1 : Donner un trial complet (7 jours à partir de maintenant)

await TrialService.initializeTrial(user.id);

// Option 2 : Les considérer comme convertis (si c\'étaient des early
adopters)

// await prisma.user.update({

// where: { id: user.id },

// data: {

// trialStatus: \'converted\',

// subscriptionStatus: \'active\',

// subscriptionTier: \'pro\',

// convertedAt: new Date(),

// subscriptionEndDate: new Date(Date.now() + 365 \* 24 \* 60 \* 60 \*
1000) // 1 an

// }

// });

console.log(\`✅ User \${user.email} migré\`);

} catch (error) {

console.error(\`❌ Erreur migration \${user.email}:\`, error);

}

}

console.log(\'✅ Migration terminée !\');

}

migrateExistingUsers()

.catch(console.error)

.finally(() =\> process.exit());

**Exécuter le script** :

npx ts-node scripts/migrate-existing-users-to-trial.ts

**12.3 Monitoring post-déploiement**

**Métriques à surveiller les 7 premiers jours** :

1.  **Taux de conversion trial → paid**

    -   Objectif : \> 10% dans les 30 premiers jours

    -   Suivre quotidiennement

2.  **Taux de churn à J+7**

    -   \% d\'utilisateurs qui ne se convertissent pas

    -   Analyser les raisons (sondage)

3.  **Engagement pendant le trial**

    -   Nombre de sessions Deep Work créées

    -   Messages envoyés à l\'agent IA

    -   Tâches créées

4.  **Performance des notifications**

    -   Taux d\'ouverture des emails

    -   Taux de clic vers /upgrade

**Requêtes SQL utiles** :

\-- Taux de conversion global

SELECT

COUNT(CASE WHEN \"trialStatus\" = \'active\' THEN 1 END) as
active_trials,

COUNT(CASE WHEN \"trialStatus\" = \'converted\' THEN 1 END) as
converted,

COUNT(CASE WHEN \"trialStatus\" = \'expired\' THEN 1 END) as expired,

ROUND(

COUNT(CASE WHEN \"trialStatus\" = \'converted\' THEN 1 END)::numeric /

NULLIF(COUNT(\*), 0) \* 100,

2

) as conversion_rate

FROM \"User\"

WHERE \"trialStartDate\" IS NOT NULL;

\-- Conversions par jour (derniers 30 jours)

SELECT

DATE(\"convertedAt\") as conversion_date,

COUNT(\*) as conversions

FROM \"User\"

WHERE \"convertedAt\" \>= NOW() - INTERVAL \'30 days\'

GROUP BY DATE(\"convertedAt\")

ORDER BY conversion_date DESC;

\-- Utilisateurs qui vont expirer dans les 3 prochains jours

SELECT

id,

email,

\"trialEndDate\",

EXTRACT(DAY FROM (\"trialEndDate\" - NOW())) as days_left

FROM \"User\"

WHERE

\"subscriptionStatus\" = \'trial\'

AND \"trialStatus\" = \'active\'

AND \"trialEndDate\" BETWEEN NOW() AND NOW() + INTERVAL \'3 days\'

ORDER BY \"trialEndDate\" ASC;

**Phase 13 : Optimisations et améliorations**

**13.1 A/B Testing de la page d\'upgrade**

**Variantes à tester** :

1.  **Prix affichés** : Mensuel vs Annuel (avec discount)

2.  **Ordre des plans** : Starter-Pro-Enterprise vs
    Pro-Starter-Enterprise

3.  **Urgence** : Avec/sans countdown \"Offre expire dans X heures\"

4.  **Social proof** : Avec/sans témoignages clients

**Implémentation** :

// lib/ab-testing/experiments.ts

export const EXPERIMENTS = {

PRICING_DISPLAY: {

id: \'pricing_display_v1\',

variants: \[\'monthly\', \'annual\'\],

defaultVariant: \'monthly\'

}

};

// Assigner une variante à l\'utilisateur

export function getVariant(userId: string, experimentId: string): string
{

const hash = simpleHash(userId + experimentId);

const variants = EXPERIMENTS\[experimentId as keyof typeof
EXPERIMENTS\].variants;

return variants\[hash % variants.length\];

}

function simpleHash(str: string): number {

let hash = 0;

for (let i = 0; i \< str.length; i++) {

hash = ((hash \<\< 5) - hash) + str.charCodeAt(i);

hash = hash & hash;

}

return Math.abs(hash);

}

**13.2 Programme de parrainage**

**Objectif** : Récompenser les utilisateurs qui invitent leurs amis

model ReferralCode {

id String \@id \@default(cuid())

userId String

user User \@relation(fields: \[userId\], references: \[id\], onDelete:
Cascade)

code String \@unique

uses Int \@default(0)

maxUses Int \@default(10)

rewardType String // extra_trial_days, discount, free_month

rewardValue Int // 7 (jours), 20 (%), 1 (mois)

createdAt DateTime \@default(now())

@@index(\[userId\])

@@index(\[code\])

}

model Referral {

id String \@id \@default(cuid())

referrerId String

referrer User \@relation(\"Referrer\", fields: \[referrerId\],
references: \[id\])

referredId String

referred User \@relation(\"Referred\", fields: \[referredId\],
references: \[id\])

codeUsed String

rewardGiven Boolean \@default(false)

createdAt DateTime \@default(now())

@@index(\[referrerId\])

@@index(\[referredId\])

}

**Bénéfices** :

-   Le parrain : +7 jours de trial ou -20% sur l\'abonnement

-   Le filleul : +3 jours de trial (total 10 jours)

**13.3 Email drip campaign**

**Séquence d\'emails pendant le trial** :

**J+0** : Email de bienvenue

-   Présentation de l\'app

-   Guide de démarrage rapide

-   Lien vers tutoriels vidéo

**J+2** : Email de tips & astuces

-   Comment maximiser la productivité

-   Fonctionnalités cachées

-   Cas d\'usage inspirants

**J+5** : Email de rappel (2 jours restants)

-   Récapitulatif de l\'utilisation

-   Ce qui sera perdu sans abonnement

-   Offre spéciale -20%

**J+6** : Email de dernière chance

-   Urgence : \"Dernier jour !\"

-   Témoignages clients

-   CTA fort : \"S\'abonner maintenant\"

**J+8** : Email post-expiration

-   Proposition de réactivation

-   Offre spéciale -30% pour 48h

-   Demande de feedback

**13.4 Indicateurs de succès du trial**

**Créer un score d\'engagement** :

// lib/trial/TrialScoring.ts

export async function calculateTrialEngagementScore(userId: string):
Promise\<number\> {

const user = await prisma.user.findUnique({

where: { id: userId },

include: {

tasks: true,

habits: true,

deepWorkSessions: true,

timeEntries: true

}

});

if (!user \|\| !user.trialStartDate) return 0;

const trialDays = Math.ceil(

(Date.now() - user.trialStartDate.getTime()) / (24 \* 60 \* 60 \* 1000)

);

let score = 0;

// Tâches créées (max 30 points)

score += Math.min(user.tasks.length \* 3, 30);

// Habitudes trackées (max 20 points)

score += Math.min(user.habits.length \* 5, 20);

// Sessions Deep Work (max 25 points)

score += Math.min(user.deepWorkSessions.length \* 5, 25);

// Utilisation de l\'agent IA (max 15 points)

// À implémenter selon vos logs

// Régularité (connexions quotidiennes) (max 10 points)

// À implémenter selon vos analytics

return Math.min(score, 100);

}

**Utilisation** :

-   Score \> 70 : Très engagé → Probabilité conversion élevée

-   Score 40-70 : Moyennement engagé → Envoyer des tips

-   Score \< 40 : Peu engagé → Campagne de réactivation

**13.5 Page de feedback post-expiration**

**Fichier** : app/trial-expired/feedback/page.tsx

\'use client\';

import { useState } from \'react\';

const REASONS = \[

\'Trop cher\',

\'Pas assez de fonctionnalités\',

\'Interface trop complexe\',

\'Je n\\\'en ai pas eu besoin finalement\',

\'Je préfère un concurrent\',

\'Autre raison\'

\];

export default function TrialFeedbackPage() {

const \[selectedReasons, setSelectedReasons\] =
useState\<string\[\]\>(\[\]);

const \[comment, setComment\] = useState(\'\');

const \[submitted, setSubmitted\] = useState(false);

const handleSubmit = async () =\> {

await fetch(\'/api/feedback/trial-exit\', {

method: \'POST\',

headers: { \'Content-Type\': \'application/json\' },

body: JSON.stringify({

reasons: selectedReasons,

comment

})

});

setSubmitted(true);

};

if (submitted) {

return (

\<div className=\"min-h-screen flex items-center justify-center
bg-gray-50\"\>

\<div className=\"max-w-md text-center\"\>

\<h2 className=\"text-2xl font-bold mb-4\"\>Merci pour ton feedback !
💙\</h2\>

\<p className=\"text-gray-600 mb-6\"\>

Tes retours nous aident à améliorer Productif.io.

\</p\>

\<p className=\"text-sm text-gray-500\"\>

Tu as changé d\'avis ? Profite de -30% avec le code
\<strong\>COMEBACK30\</strong\>

\</p\>

\</div\>

\</div\>

);

}

return (

\<div className=\"min-h-screen flex items-center justify-center
bg-gray-50 py-12 px-4\"\>

\<div className=\"max-w-2xl w-full bg-white rounded-lg shadow-lg p-8\"\>

\<h1 className=\"text-3xl font-bold mb-4\"\>Pourquoi ne continues-tu pas
?\</h1\>

\<p className=\"text-gray-600 mb-8\"\>

Aide-nous à comprendre ce qui n\'a pas fonctionné pour toi

\</p\>

\<div className=\"space-y-4 mb-6\"\>

{REASONS.map((reason) =\> (

\<label key={reason} className=\"flex items-center space-x-3
cursor-pointer\"\>

\<input

type=\"checkbox\"

checked={selectedReasons.includes(reason)}

onChange={(e) =\> {

if (e.target.checked) {

setSelectedReasons(\[\...selectedReasons, reason\]);

} else {

setSelectedReasons(selectedReasons.filter(r =\> r !== reason));

}

}}

className=\"w-5 h-5 text-blue-500 rounded\"

/\>

\<span className=\"text-gray-700\"\>{reason}\</span\>

\</label\>

))}

\</div\>

\<textarea

value={comment}

onChange={(e) =\> setComment(e.target.value)}

placeholder=\"Des suggestions pour nous améliorer ? (optionnel)\"

className=\"w-full border border-gray-300 rounded-lg p-3 mb-6\"

rows={4}

/\>

\<button

onClick={handleSubmit}

className=\"w-full bg-blue-500 text-white py-3 rounded-lg font-medium
hover:bg-blue-600 transition-colors\"

\>

Envoyer mon feedback

\</button\>

\</div\>

\</div\>

);

}

**Phase 14 : Documentation**

**14.1 Documentation utilisateur**

**Guide** : docs/trial-system-user-guide.md

\# Guide du système de période d\'essai

\## Pour les nouveaux utilisateurs

\### Inscription

\- À l\'inscription, vous bénéficiez automatiquement de \*\*7 jours
d\'essai gratuit\*\*

\- Aucune carte bancaire requise

\- Accès complet à toutes les fonctionnalités

\### Pendant l\'essai

\- Testez toutes les fonctionnalités sans limite

\- Recevez des rappels à J-3 et J-1

\- Une bannière vous informe des jours restants

\### Après l\'essai

\- Sans abonnement : accès bloqué au dashboard et à l\'agent IA

\- Vos données sont conservées 30 jours

\- Possibilité de réactiver à tout moment

\### S\'abonner

1\. Cliquez sur \"Choisir mon abonnement\"

2\. Sélectionnez votre plan (Starter, Pro, Enterprise)

3\. Renseignez vos informations de paiement

4\. Profitez de l\'accès illimité !

\## Questions fréquentes

\*\*Puis-je annuler à tout moment ?\*\*

Oui, annulation possible depuis les paramètres. Accès maintenu jusqu\'à
la fin de la période payée.

\*\*Que deviennent mes données après expiration ?\*\*

Conservées 30 jours. Réactivez votre compte pour les récupérer.

\*\*Puis-je changer de plan ?\*\*

Oui, upgrade/downgrade possible à tout moment depuis les paramètres.

\*\*Y a-t-il un engagement minimum ?\*\*

Non, abonnement mensuel sans engagement.

**14.2 Documentation technique**

**Guide** : docs/tech/trial-system-architecture.md

\# Architecture du système de Trial

\## Vue d\'ensemble

Le système de trial gère automatiquement :

\- Initialisation à l\'inscription

\- Vérification d\'accès (middleware)

\- Notifications de rappel

\- Conversion vers abonnement payant

\- Blocage après expiration

\## Composants

\### 1. TrialService (\`lib/trial/TrialService.ts\`)

Service central de gestion des trials.

\*\*Méthodes principales\*\* :

\- \`initializeTrial(userId)\` : Créer un trial de 7 jours

\- \`hasAccess(userId)\` : Vérifier si l\'utilisateur a accès

\- \`convertTrialToSubscription()\` : Convertir en abonnement

\- \`expireTrial(userId)\` : Marquer comme expiré

\### 2. Middleware (\`middleware/trial-check.ts\`)

Vérifie l\'accès avant chaque requête dashboard.

\*\*Comportement\*\* :

\- Utilisateur non connecté → redirect \`/login\`

\- Trial expiré → redirect \`/upgrade\`

\- Trial actif → passe + headers X-Trial-Status

\### 3. TrialReminderScheduler

Cron job quotidien (10h) envoyant les rappels.

\*\*Notifications\*\* :

\- J-3 : Email + WhatsApp

\- J-1 : Email + WhatsApp

\- J+0 : Notification d\'expiration

\### 4. Intégration Stripe

Webhook Stripe active l\'abonnement automatiquement.

\*\*Événements écoutés\*\* :

\- \`checkout.session.completed\` → Conversion

\- \`customer.subscription.updated\` → Mise à jour

\- \`customer.subscription.deleted\` → Désactivation

\## Flux utilisateur

Inscription ↓ initializeTrial() ↓ Trial actif (7 jours) ↓ \[J-3\] Rappel
email/WhatsApp ↓ \[J-1\] Rappel email/WhatsApp ↓ \[J+0\] Notification
expiration ↓ Accès bloqué → Page /upgrade ↓ Abonnement Stripe ↓
convertTrialToSubscription() ↓ Accès illimité

\## Base de données

\*\*Champs User\*\* :

\- \`trialStartDate\` : Date de début

\- \`trialEndDate\` : Date de fin

\- \`trialStatus\` : active, expired, converted

\- \`subscriptionStatus\` : trial, active, cancelled, expired

\- \`subscriptionTier\` : starter, pro, enterprise

\*\*Table TrialNotification\*\* :

Historique des notifications envoyées pour éviter les doublons.

\## Monitoring

\### Métriques clés

\- Taux de conversion trial → paid

\- Temps moyen avant conversion

\- Raisons d\'abandon (feedback)

\### Logs importants

✅ Trial initialisé pour user {userId} ⏰ Trial expiré pour user
{userId} 🎉 Trial converti en subscription pour user {userId}

\## Commandes utiles

\### Réinitialiser un trial (dev)

\`\`\`sql

UPDATE \"User\"

SET

\"trialStartDate\" = NOW(),

\"trialEndDate\" = NOW() + INTERVAL \'7 days\',

\"trialStatus\" = \'active\',

\"subscriptionStatus\" = \'trial\'

WHERE email = \'test@example.com\';

**Forcer l\'expiration (test)**

UPDATE \"User\"

SET \"trialEndDate\" = NOW() - INTERVAL \'1 day\'

WHERE email = \'test@example.com\';

\-\--

\## Résumé des fichiers à créer/modifier

\### Nouveaux fichiers (17)

1\. \`lib/trial/TrialService.ts\`

2\. \`lib/trial/TrialReminderScheduler.ts\`

3\. \`middleware/trial-check.ts\`

4\. \`components/trial/TrialBanner.tsx\`

5\. \`components/upgrade/PricingPlans.tsx\`

6\. \`app/upgrade/page.tsx\`

7\. \`app/trial-expired/feedback/page.tsx\`

8\. \`app/api/user/trial-status/route.ts\`

9\. \`app/api/stripe/create-checkout-session/route.ts\`

10\. \`app/api/webhooks/stripe/route.ts\` (ou modifier existant)

11\. \`app/api/feedback/trial-exit/route.ts\`

12\. \`app/api/auth/register/route.ts\` (modifier)

13\. \`app/dashboard/admin/trials/page.tsx\`

14\. \`scripts/migrate-existing-users-to-trial.ts\`

15\. \`\_\_tests\_\_/trial.test.ts\`

16\. \`docs/trial-system-user-guide.md\`

17\. \`docs/tech/trial-system-architecture.md\`

\### Fichiers à modifier (6)

1\. \`prisma/schema.prisma\` (modèle User + TrialNotification)

2\. \`middleware.ts\` (intégrer trial-check)

3\. \`middleware/api-auth.ts\` (vérification accès agent IA)

4\. \`app/api/webhooks/whatsapp/route.ts\` (message expiration)

5\. \`lib/ReactiveSchedulerManager.js\` (intégrer
TrialReminderScheduler)

6\. \`app/dashboard/layout.tsx\` (ajouter TrialBanner)

\-\--

\## Variables d\'environnement requises

\`\`\`env

\# Stripe

STRIPE_SECRET_KEY=sk_test\_\...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test\_\...

STRIPE_WEBHOOK_SECRET=whsec\_\...

\# Price IDs (à créer dans Stripe Dashboard)

STRIPE_PRICE_ID_STARTER=price\_\...

STRIPE_PRICE_ID_PRO=price\_\...

STRIPE_PRICE_ID_ENTERPRISE=price\_\...

\# App

NEXT_PUBLIC_APP_URL=https://productif.io

\# Database (déjà existant)

DATABASE_URL=postgresql://\...

\# Email (déjà existant)

SMTP_HOST=\...

SMTP_USER=\...

SMTP_PASSWORD=\...

\# WhatsApp (déjà existant)

WHATSAPP_ACCESS_TOKEN=\...

WHATSAPP_PHONE_NUMBER_ID=\...

**Timeline d\'implémentation suggérée**

**Semaine 1 : Core système**

-   Jour 1-2 : Modèles Prisma + TrialService

-   Jour 3-4 : Middleware + vérifications d\'accès

-   Jour 5 : Tests manuels

**Semaine 2 : UI/UX**

-   Jour 1-2 : Page /upgrade + PricingPlans

-   Jour 3 : TrialBanner + notifications in-app

-   Jour 4-5 : Intégration Stripe

**Semaine 3 : Notifications**

-   Jour 1-2 : TrialReminderScheduler

-   Jour 3 : Templates emails

-   Jour 4 : Tests notifications

-   Jour 5 : Feedback page

**Semaine 4 : Finitions**

-   Jour 1-2 : Dashboard admin

-   Jour 3 : Migration utilisateurs existants

-   Jour 4 : Documentation

-   Jour 5 : Tests finaux + déploiement

**Temps total estimé : 3-4 semaines** pour un développeur full-stack
expérimenté.

**Système complet prêt pour production ! 🚀**
