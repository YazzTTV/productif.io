import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Politique de Confidentialité</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          Chez productif.io, nous respectons votre vie privée et nous nous engageons à protéger vos données personnelles. 
          Cette politique de confidentialité vous informe sur la façon dont nous traitons vos données personnelles lorsque 
          vous visitez notre site web ou utilisez nos services, indépendamment du canal ou du moyen utilisé.
        </p>
        <p className="mb-4">
          Le responsable du traitement des données est Noah Lugagne, entrepreneur individuel sous le régime de la micro-entreprise, 
          domicilié au 397 bis route de montpellier, 34730 Prade-le-Lez, France.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Les données que nous collectons</h2>
        <p className="mb-4">
          Nous pouvons collecter, utiliser, stocker et transférer différents types de données personnelles vous concernant :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>Données d'identité :</strong> prénom, nom, nom d'utilisateur ou identifiant similaire.</li>
          <li><strong>Données de contact :</strong> adresse e-mail, numéro de téléphone, adresse postale.</li>
          <li><strong>Données techniques :</strong> adresse IP, données de connexion, type et version du navigateur, fuseau horaire, types et versions de plug-ins, système d'exploitation et plateforme.</li>
          <li><strong>Données d'utilisation :</strong> informations sur la façon dont vous utilisez notre site web et nos services.</li>
          <li><strong>Données de marketing et communication :</strong> vos préférences pour la réception de communications marketing et vos préférences de communication.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Comment nous utilisons vos données</h2>
        <p className="mb-4">
          Nous utilisons vos données personnelles uniquement lorsque la loi nous y autorise. Le plus souvent, nous utiliserons vos données personnelles dans les circonstances suivantes :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Lorsque nous devons exécuter le contrat que nous sommes sur le point de conclure ou que nous avons conclu avec vous.</li>
          <li>Lorsque cela est nécessaire pour nos intérêts légitimes (ou ceux d'un tiers) et que vos intérêts et droits fondamentaux ne prévalent pas sur ces intérêts.</li>
          <li>Lorsque nous devons nous conformer à une obligation légale ou réglementaire.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Partage de vos données personnelles</h2>
        <p className="mb-4">
          Nous pouvons être amenés à partager vos données personnelles avec les parties suivantes :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Des prestataires de services qui fournissent des services d'administration informatique et système.</li>
          <li>Nos conseillers professionnels, notamment des avocats, des banquiers, des auditeurs et des assureurs.</li>
          <li>Les autorités fiscales et réglementaires, qui nécessitent des rapports sur les activités de traitement dans certaines circonstances.</li>
        </ul>
        <p className="mb-4">
          Nous exigeons de tous les tiers qu'ils respectent la sécurité de vos données personnelles et qu'ils les traitent conformément à la loi. Nous n'autorisons pas nos prestataires de services tiers à utiliser vos données personnelles à leurs propres fins.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Sécurité des données</h2>
        <p className="mb-4">
          Nous avons mis en place des mesures de sécurité appropriées pour empêcher que vos données personnelles ne soient accidentellement perdues, utilisées ou consultées de manière non autorisée, modifiées ou divulguées. De plus, nous limitons l'accès à vos données personnelles aux employés, agents, contractants et autres tiers qui ont un besoin professionnel de les connaître.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Conservation des données</h2>
        <p className="mb-4">
          Nous conserverons vos données personnelles uniquement aussi longtemps que nécessaire pour atteindre les objectifs pour lesquels nous les avons collectées, y compris pour satisfaire aux exigences légales, comptables ou de déclaration.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Vos droits légaux</h2>
        <p className="mb-4">
          Dans certaines circonstances, vous avez des droits en vertu des lois sur la protection des données concernant vos données personnelles :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>Droit d'accès :</strong> vous pouvez demander une copie des informations personnelles que nous détenons à votre sujet.</li>
          <li><strong>Droit de rectification :</strong> vous pouvez demander la correction des informations personnelles inexactes que nous détenons à votre sujet.</li>
          <li><strong>Droit à l'effacement :</strong> vous pouvez nous demander de supprimer ou de retirer des informations personnelles lorsqu'il n'y a aucune bonne raison pour nous de continuer à les traiter.</li>
          <li><strong>Droit de s'opposer au traitement :</strong> vous pouvez vous opposer au traitement de vos informations personnelles.</li>
          <li><strong>Droit à la portabilité des données :</strong> vous pouvez demander le transfert de vos informations personnelles à vous-même ou à un tiers.</li>
        </ul>
        <p className="mb-4">
          Si vous souhaitez exercer l'un de ces droits, veuillez nous contacter à contact@productif.io.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Modifications de cette politique de confidentialité</h2>
        <p className="mb-4">
          Nous nous réservons le droit de mettre à jour cette politique de confidentialité à tout moment. Nous publierons toute mise à jour sur cette page et, si les modifications sont importantes, nous vous en informerons par e-mail.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Nous contacter</h2>
        <p className="mb-4">
          Si vous avez des questions sur cette politique de confidentialité ou sur nos pratiques en matière de confidentialité, veuillez nous contacter à :
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