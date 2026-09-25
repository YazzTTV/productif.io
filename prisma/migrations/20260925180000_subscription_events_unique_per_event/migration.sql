-- Une annulation, une expiration ou un remboursement portent le MEME
-- transactionId que l'achat. Avec l'unicite sur transactionId seul, la base les
-- rejetait comme doublons (P2002) et le webhook les ignorait : un essai annule
-- n'etait jamais enregistre, un abonnement expire restait premium pour toujours.
-- L'unicite passe sur le couple (transactionId, eventName), qui garde la
-- protection contre un meme evenement recu deux fois.
DROP INDEX IF EXISTS "subscription_events_transactionId_key";
CREATE UNIQUE INDEX "subscription_events_transactionId_eventName_key" ON "subscription_events"("transactionId", "eventName");
