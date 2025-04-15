import React from 'react';
import Link from 'next/link';

export default function RefundPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Politique de Remboursement</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          Chez productif.io, nous nous engageons à offrir un service de qualité et à garantir la satisfaction de nos clients. Cette politique de remboursement définit les conditions dans lesquelles nous proposons des remboursements pour nos services.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Période d'essai</h2>
        <p className="mb-4">
          Nous offrons une période d'essai gratuite de 14 jours pour tous nos nouveaux utilisateurs. Durant cette période, vous pouvez explorer toutes les fonctionnalités de notre plateforme sans engagement. Aucune carte de crédit n'est requise pour la période d'essai.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Politique de remboursement pour les abonnements mensuels</h2>
        <p className="mb-4">
          Si vous êtes insatisfait de nos services, vous pouvez demander un remboursement dans les 14 jours suivant la date de votre premier paiement de 150€ pour l'abonnement mensuel. Après cette période de 14 jours, nous ne proposons pas de remboursements pour les abonnements mensuels en cours.
        </p>
        <p className="mb-4">
          Veuillez noter que l'annulation de votre abonnement mensuel vous permet de continuer à utiliser nos services jusqu'à la fin de la période de facturation actuelle, mais empêche le renouvellement automatique pour le mois suivant.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Politique de remboursement pour les abonnements annuels</h2>
        <p className="mb-4">
          Pour les abonnements annuels, nous offrons un remboursement complet si la demande est faite dans les 30 jours suivant la date du paiement. Après cette période de 30 jours, nous pouvons offrir un remboursement partiel au prorata des mois non utilisés, à notre discrétion.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Comment demander un remboursement</h2>
        <p className="mb-4">
          Pour demander un remboursement, veuillez nous contacter à productifio@gmail.com avec les informations suivantes :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Votre nom et adresse email associés à votre compte</li>
          <li>La date de votre achat</li>
          <li>La raison de votre demande de remboursement</li>
        </ul>
        <p className="mb-4">
          Nous examinerons votre demande et vous répondrons dans un délai de 5 jours ouvrables.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Exceptions</h2>
        <p className="mb-4">
          Nous nous réservons le droit de refuser les demandes de remboursement dans les cas suivants :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Utilisation abusive de notre service</li>
          <li>Violation de nos Conditions Générales d'Utilisation</li>
          <li>Demandes de remboursement répétées de la part du même client</li>
          <li>Problèmes liés à des facteurs externes comme les complications de connexion Internet, incompatibilités de navigateurs, ou autres problèmes techniques qui ne sont pas directement liés à notre service</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Délais de remboursement</h2>
        <p className="mb-4">
          Une fois votre remboursement approuvé, il sera traité dans un délai de 10 jours ouvrables. Le temps nécessaire pour que le montant apparaisse sur votre compte dépend de votre institution financière et peut prendre jusqu'à 10 jours supplémentaires.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Modifications de cette politique</h2>
        <p className="mb-4">
          Nous nous réservons le droit de modifier cette politique de remboursement à tout moment. Les modifications entreront en vigueur dès leur publication sur notre site web. Nous vous encourageons à consulter régulièrement cette page pour rester informé des éventuelles mises à jour.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p className="mb-4">
          Si vous avez des questions concernant notre politique de remboursement, veuillez nous contacter à :
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