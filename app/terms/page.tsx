import React from 'react';
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Conditions Générales d'Utilisation</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <p className="mb-4">
          Bienvenue sur productif.io. En accédant à notre site web ou en utilisant nos services, vous acceptez d'être lié par ces Conditions Générales d'Utilisation ("CGU"). Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
        </p>
        <p className="mb-4">
          productif.io est une application de gestion de productivité qui aide les professionnels et les équipes à organiser leurs tâches, projets et temps de travail, en offrant un service complet de centralisation pour optimiser votre productivité.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">2. Définitions</h2>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>"Nous", "notre", "nos"</strong> font référence à Noah Lugagne, entrepreneur individuel sous le régime de la micro-entreprise.</li>
          <li><strong>"Vous", "votre", "vos"</strong> font référence à l'utilisateur de nos services.</li>
          <li><strong>"Services"</strong> désigne l'ensemble des fonctionnalités, outils et prestations proposés par productif.io.</li>
          <li><strong>"Contenu"</strong> désigne toutes les informations, données, textes, images ou autres matériels que vous soumettez à nos services.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">3. Inscription et compte</h2>
        <p className="mb-4">
          Pour utiliser certaines fonctionnalités de nos services, vous devez créer un compte. Vous êtes responsable de maintenir la confidentialité de vos informations de connexion et de toutes les activités qui se produisent sous votre compte.
        </p>
        <p className="mb-4">
          Vous vous engagez à :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Fournir des informations exactes, actuelles et complètes lors de la création de votre compte.</li>
          <li>Mettre à jour rapidement vos informations pour qu'elles restent exactes, actuelles et complètes.</li>
          <li>Protéger la sécurité de votre compte et de votre mot de passe.</li>
          <li>Nous informer immédiatement de toute utilisation non autorisée de votre compte ou de toute autre violation de sécurité.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">4. Utilisation des services</h2>
        <p className="mb-4">
          Vous acceptez d'utiliser nos services uniquement à des fins légales et conformément à ces CGU. Vous vous engagez à ne pas :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Utiliser nos services d'une manière qui pourrait endommager, désactiver, surcharger ou altérer nos services.</li>
          <li>Utiliser des robots, des araignées ou d'autres dispositifs automatiques pour accéder à nos services.</li>
          <li>Tenter d'accéder à des zones ou fonctionnalités de nos services auxquelles vous n'êtes pas autorisé à accéder.</li>
          <li>Introduire des virus, des chevaux de Troie, des vers ou tout autre code malveillant.</li>
          <li>Violer les droits de propriété intellectuelle ou autres droits de tiers.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">5. Contenu de l'utilisateur</h2>
        <p className="mb-4">
          Vous conservez tous les droits sur le contenu que vous soumettez à nos services. En soumettant du contenu, vous nous accordez une licence mondiale, non exclusive, libre de redevance pour utiliser, reproduire, modifier, adapter, publier et afficher ce contenu uniquement dans le but de vous fournir nos services.
        </p>
        <p className="mb-4">
          Vous êtes entièrement responsable de tout contenu que vous soumettez. Vous déclarez et garantissez que :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Vous possédez ou avez obtenu tous les droits nécessaires pour le contenu que vous soumettez.</li>
          <li>Le contenu ne viole pas et ne violera pas les droits de tiers, y compris les droits de propriété intellectuelle et les droits à la vie privée.</li>
          <li>Le contenu n'est pas diffamatoire, obscène, offensant ou illégal de quelque manière que ce soit.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">6. Propriété intellectuelle</h2>
        <p className="mb-4">
          Nos services et leur contenu, fonctionnalités et fonctionnalités sont et resteront la propriété exclusive de productif.io et de ses concédants de licence. Nos services sont protégés par le droit d'auteur, les marques de commerce et d'autres lois en France et à l'étranger.
        </p>
        <p className="mb-4">
          Aucune disposition des présentes CGU ne vous confère le droit d'utiliser le nom productif.io, ses marques de commerce, logos, noms de domaine ou autres caractéristiques distinctives de la marque.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">7. Résiliation</h2>
        <p className="mb-4">
          Nous nous réservons le droit de suspendre ou de résilier votre accès à nos services, avec ou sans préavis, pour quelque raison que ce soit, y compris, sans limitation, si nous croyons raisonnablement que vous avez violé ces CGU.
        </p>
        <p className="mb-4">
          Vous pouvez résilier votre compte à tout moment en suivant les instructions sur notre site web. En cas de résiliation, votre droit d'utiliser nos services cessera immédiatement.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">8. Limitation de responsabilité</h2>
        <p className="mb-4">
          Dans toute la mesure permise par la loi applicable, productif.io ne sera pas responsable des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs, ou de toute perte de profits ou de revenus, que ce soit encouru directement ou indirectement, ou de toute perte de données, d'utilisation, de clientèle ou d'autres pertes intangibles.
        </p>
        <p className="mb-4">
          En aucun cas, la responsabilité totale de productif.io pour toutes réclamations liées aux services ne dépassera le montant payé par vous à productif.io au cours des douze derniers mois.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">9. Modifications</h2>
        <p className="mb-4">
          Nous nous réservons le droit de modifier ces CGU à tout moment. Si nous apportons des modifications importantes, nous vous en informerons par e-mail ou par un avis sur notre site web avant que les modifications ne prennent effet.
        </p>
        <p className="mb-4">
          Votre utilisation continue de nos services après l'entrée en vigueur des CGU révisées constitue votre acceptation de ces CGU révisées.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">10. Droit applicable et juridiction</h2>
        <p className="mb-4">
          Ces CGU sont régies et interprétées conformément aux lois françaises. Tout litige découlant de ou lié à ces CGU sera soumis à la compétence exclusive des tribunaux de Paris, France.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
        <p className="mb-4">
          Si vous avez des questions concernant ces CGU, veuillez nous contacter à :
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