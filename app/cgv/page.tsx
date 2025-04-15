import React from 'react';
import Link from 'next/link';

export default function CGV() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Conditions Générales de Vente</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">1. Objet</h2>
        <p className="mb-4">
          Les présentes Conditions Générales de Vente (ci-après "CGV") régissent les relations contractuelles entre Noah Lugagne, entrepreneur individuel sous le régime de la micro-entreprise (ci-après "le Prestataire") et toute personne physique ou morale (ci-après "le Client") souscrivant à un abonnement ou achetant des services sur le site productif.io (ci-après "le Service").
        </p>
        <p className="mb-4">
          Toute souscription ou achat implique l'acceptation sans réserve des présentes CGV par le Client. Ces CGV prévalent sur tout autre document du Client.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">2. Description du service</h2>
        <p className="mb-4">
          Productif.io est une application de gestion de productivité qui permet aux utilisateurs de gérer leurs tâches, projets, temps et habitudes. Le service offre des fonctionnalités complètes de centralisation et d'organisation pour optimiser votre productivité personnelle et professionnelle.
        </p>
        <p className="mb-4">
          Le Service est proposé sous forme d'abonnement mensuel selon les modalités présentées sur le site.
        </p>
        <p className="mb-4">
          Le Prestataire se réserve le droit de faire évoluer les fonctionnalités et services proposés, sans que cela ne constitue une modification substantielle des CGV.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">3. Tarifs et modalités de paiement</h2>
        <p className="mb-4">
          Les prix des services sont indiqués en euros et s'élèvent à 150€ par mois pour l'abonnement mensuel. Le Prestataire se réserve le droit de modifier ses tarifs à tout moment. Les nouveaux tarifs entreront en vigueur pour tout nouveau contrat ou renouvellement postérieur à la date de modification.
        </p>
        <p className="mb-4">
          Le paiement s'effectue par carte bancaire, prélèvement automatique ou tout autre moyen de paiement proposé sur le site. Pour les abonnements, le paiement est récurrent et automatique aux échéances indiquées lors de la souscription.
        </p>
        <p className="mb-4">
          En cas de retard ou de défaut de paiement, le Prestataire se réserve le droit de suspendre l'accès au Service jusqu'à régularisation.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">4. Durée et renouvellement</h2>
        <p className="mb-4">
          L'abonnement est souscrit pour la durée choisie par le Client lors de la commande (mensuelle ou annuelle). À l'issue de cette période, l'abonnement est automatiquement renouvelé pour une durée identique, sauf résiliation par le Client dans les conditions prévues à l'article 5.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">5. Résiliation</h2>
        <p className="mb-4">
          Le Client peut résilier son abonnement à tout moment depuis son espace client. La résiliation prendra effet à la fin de la période d'abonnement en cours, aucun remboursement ne sera effectué pour la période restante sauf cas spécifiques mentionnés dans notre <Link href="/refund-policy" className="text-blue-600 hover:underline">Politique de Remboursement</Link>.
        </p>
        <p className="mb-4">
          Le Prestataire peut résilier ou suspendre le compte du Client et son droit d'utilisation du Service immédiatement et sans préavis en cas de non-respect des présentes CGV.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">6. Droit de rétractation</h2>
        <p className="mb-4">
          Conformément aux dispositions légales en vigueur, le Client disposant du statut de consommateur bénéficie d'un délai de 14 jours à compter de la souscription pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalités.
        </p>
        <p className="mb-4">
          En cas d'exercice du droit de rétractation, le Prestataire remboursera le Client de la totalité des sommes versées, au plus tard dans les 14 jours suivant la date à laquelle ce droit a été exercé.
        </p>
        <p className="mb-4">
          Le droit de rétractation ne peut être exercé pour les services pleinement exécutés avant la fin du délai de rétractation et dont l'exécution a commencé après accord préalable exprès du Client et renoncement exprès à son droit de rétractation.
        </p>
        <p className="mb-4">
          Productif.io offre également une période d'essai gratuite de 14 jours pour tous les nouveaux utilisateurs, permettant de tester l'ensemble des fonctionnalités sans engagement.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">7. Disponibilité et maintenance</h2>
        <p className="mb-4">
          Le Prestataire s'engage à fournir le meilleur niveau de disponibilité possible du Service. Toutefois, il ne peut garantir une disponibilité continue et se réserve la possibilité d'interrompre temporairement l'accès au Service pour des raisons de maintenance, de mise à jour ou d'amélioration.
        </p>
        <p className="mb-4">
          Dans la mesure du possible, le Prestataire informera préalablement le Client de toute interruption programmée du Service.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">8. Responsabilité</h2>
        <p className="mb-4">
          Le Prestataire s'engage à mettre en œuvre tous les moyens nécessaires pour assurer un service de qualité. Toutefois, sa responsabilité ne pourra être engagée en cas de :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Interruption temporaire du Service pour maintenance</li>
          <li>Défaillance ou dysfonctionnement du réseau Internet</li>
          <li>Perte de données ou dommages indirects</li>
          <li>Utilisation du Service non conforme aux présentes CGV</li>
        </ul>
        <p className="mb-4">
          La responsabilité du Prestataire, si elle est établie, sera limitée au montant des sommes effectivement payées par le Client pour l'abonnement en cours.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">9. Propriété intellectuelle</h2>
        <p className="mb-4">
          Tous les éléments du Service, incluant sans limitation les textes, graphismes, logos, icônes, images, clips audio et logiciels, sont la propriété exclusive du Prestataire ou de ses partenaires, et sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.
        </p>
        <p className="mb-4">
          Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces éléments est strictement interdite sans l'accord écrit préalable du Prestataire.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">10. Protection des données personnelles</h2>
        <p className="mb-4">
          Le Prestataire s'engage à respecter la vie privée des Clients et à traiter leurs données personnelles conformément à la législation en vigueur, notamment le Règlement Général sur la Protection des Données (RGPD).
        </p>
        <p className="mb-4">
          Pour plus d'informations sur la façon dont nous traitons vos données, veuillez consulter notre <Link href="/privacy-policy" className="text-blue-600 hover:underline">Politique de Confidentialité</Link>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">11. Loi applicable et juridiction</h2>
        <p className="mb-4">
          Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant tout recours judiciaire. À défaut, les tribunaux français seront seuls compétents.
        </p>
        <p className="mb-4">
          Conformément aux dispositions du Code de la consommation concernant le règlement amiable des litiges, le Client peut recourir au service de médiation proposé par le Prestataire. Le médiateur tentera, en toute indépendance et impartialité, de rapprocher les parties en vue d'aboutir à une solution amiable.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
        <p className="mb-4">
          Pour toute question relative à ces CGV, veuillez nous contacter à l'adresse suivante :
        </p>
        <p className="mb-4">
          Email: productifio@gmail.com<br />
          Adresse: 397 bis route de montpellier, 34730 Prade-le-Lez, France
        </p>
      </section>

      <div className="mt-12 border-t pt-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
} 