import React from 'react';
import Link from 'next/link';

export default function LegalNotice() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Mentions Légales</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">1. Éditeur du site</h2>
        <p className="mb-4">
          Le site productif.io est édité par Noah Lugagne, entrepreneur individuel sous le régime de la micro-entreprise, dont le siège social est situé au 397 bis route de montpellier, 34730 Prade-le-Lez, France.
        </p>
        <p className="mb-4">
          Directeur de la publication : Noah Lugagne
        </p>
        <p className="mb-4">
          Email de contact : productifio@gmail.com
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">2. Hébergement</h2>
        <p className="mb-4">
          Le site productif.io est hébergé par Vercel Inc., dont le siège social est situé au 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
        </p>
        <p className="mb-4">
          Site web de l'hébergeur : vercel.com
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">3. Propriété intellectuelle</h2>
        <p className="mb-4">
          L'ensemble du contenu du site productif.io (architecture, textes, logos, images, photographies, illustrations, etc.) est la propriété exclusive de [Nom de votre entreprise] ou de ses partenaires, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.
        </p>
        <p className="mb-4">
          Toute reproduction, représentation, diffusion ou rediffusion, totale ou partielle, du contenu de ce site par quelque procédé que ce soit, sans l'autorisation expresse et préalable de [Nom de votre entreprise], est interdite et constituerait une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la Propriété Intellectuelle.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">4. Données personnelles</h2>
        <p className="mb-4">
          Les informations personnelles collectées sur le site productif.io sont nécessaires au bon fonctionnement des services. Ces informations sont destinées exclusivement à Noah Lugagne et ne seront en aucun cas cédées à des tiers sans votre accord express.
        </p>
        <p className="mb-4">
          Conformément à la loi Informatique et Libertés du 6 janvier 1978 modifiée, au Règlement Général sur la Protection des Données (RGPD) et à la loi pour une République Numérique du 7 octobre 2016, vous disposez d'un droit d'accès, de rectification, de suppression, de limitation, de portabilité et d'opposition aux données personnelles vous concernant.
        </p>
        <p className="mb-4">
          Pour exercer ces droits, vous pouvez nous contacter à l'adresse suivante : [adresse email de contact] ou par courrier à [adresse postale de l'entreprise].
        </p>
        <p className="mb-4">
          Pour plus d'informations sur la façon dont nous traitons vos données, veuillez consulter notre <Link href="/privacy-policy" className="text-blue-600 hover:underline">Politique de Confidentialité</Link>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">5. Cookies</h2>
        <p className="mb-4">
          Le site productif.io utilise des cookies pour améliorer l'expérience utilisateur et recueillir des statistiques de fréquentation. Vous pouvez désactiver l'utilisation des cookies en modifiant les paramètres de votre navigateur.
        </p>
        <p className="mb-4">
          Pour en savoir plus sur notre utilisation des cookies, veuillez consulter notre <Link href="/privacy-policy" className="text-blue-600 hover:underline">Politique de Confidentialité</Link>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">6. Loi applicable et juridiction</h2>
        <p className="mb-4">
          Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux français seront seuls compétents.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">7. Contact</h2>
        <p className="mb-4">
          Pour toute question relative à ces mentions légales, vous pouvez nous contacter à l'adresse suivante :
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