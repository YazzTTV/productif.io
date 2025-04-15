import React from 'react';
import Link from 'next/link';

export default function CookiePolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Politique de Cookies</h1>
      <p className="text-sm text-gray-500 mb-8">Dernière mise à jour: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          La présente politique de cookies explique comment productif.io utilise les cookies et technologies similaires pour reconnaître votre appareil lorsque vous visitez notre site web et utilisez nos services. Elle détaille les différents types de cookies que nous utilisons, pourquoi nous les utilisons, et comment vous pouvez exercer vos droits pour contrôler notre utilisation des cookies.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Qu'est-ce qu'un cookie ?</h2>
        <p className="mb-4">
          Un cookie est un petit fichier texte placé sur votre appareil (ordinateur, tablette ou téléphone mobile) lorsque vous visitez un site web. Les cookies sont largement utilisés par les propriétaires de sites web pour faire fonctionner leurs sites, les rendre plus efficaces, ainsi que pour fournir des informations aux propriétaires du site.
        </p>
        <p className="mb-4">
          Les cookies ne contiennent généralement aucune information permettant d'identifier personnellement un utilisateur, mais les informations personnelles que nous stockons à votre sujet peuvent être liées aux informations stockées dans les cookies et obtenues à partir de ceux-ci.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Comment utilisons-nous les cookies ?</h2>
        <p className="mb-4">
          Nous utilisons différents types de cookies pour les raisons suivantes :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>Cookies strictement nécessaires :</strong> Ces cookies sont essentiels pour vous permettre de naviguer sur notre site et d'utiliser ses fonctionnalités. Sans ces cookies, les services que vous avez demandés, comme la mémorisation de vos informations de connexion, ne peuvent pas être fournis.</li>
          <li><strong>Cookies de performance et d'analyse :</strong> Ces cookies nous permettent de reconnaître et de compter le nombre de visiteurs sur notre site, et de voir comment les visiteurs se déplacent sur notre site lorsqu'ils l'utilisent. Cela nous aide à améliorer le fonctionnement de notre site, par exemple en nous assurant que les utilisateurs trouvent facilement ce qu'ils recherchent.</li>
          <li><strong>Cookies de fonctionnalité :</strong> Ces cookies sont utilisés pour vous reconnaître lorsque vous revenez sur notre site. Cela nous permet de personnaliser notre contenu pour vous, de vous accueillir par votre nom et de mémoriser vos préférences (par exemple, votre choix de langue ou de région).</li>
          <li><strong>Cookies de ciblage :</strong> Ces cookies enregistrent votre visite sur notre site, les pages que vous avez visitées et les liens que vous avez suivis. Nous utiliserons ces informations pour rendre notre site et la publicité qui y est affichée plus pertinents par rapport à vos intérêts.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Les cookies que nous utilisons</h2>
        <p className="mb-4">
          Voici une liste détaillée des cookies que nous utilisons et leur finalité :
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border border-gray-300 text-left">Nom du cookie</th>
                <th className="px-4 py-2 border border-gray-300 text-left">Finalité</th>
                <th className="px-4 py-2 border border-gray-300 text-left">Durée</th>
                <th className="px-4 py-2 border border-gray-300 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border border-gray-300">auth_token</td>
                <td className="px-4 py-2 border border-gray-300">Authentification et session utilisateur</td>
                <td className="px-4 py-2 border border-gray-300">30 jours</td>
                <td className="px-4 py-2 border border-gray-300">Strictement nécessaire</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">_ga</td>
                <td className="px-4 py-2 border border-gray-300">Google Analytics - Distinguer les utilisateurs</td>
                <td className="px-4 py-2 border border-gray-300">2 ans</td>
                <td className="px-4 py-2 border border-gray-300">Performance</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">_gid</td>
                <td className="px-4 py-2 border border-gray-300">Google Analytics - Distinguer les utilisateurs</td>
                <td className="px-4 py-2 border border-gray-300">24 heures</td>
                <td className="px-4 py-2 border border-gray-300">Performance</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">preferences</td>
                <td className="px-4 py-2 border border-gray-300">Mémoriser les préférences de l'utilisateur</td>
                <td className="px-4 py-2 border border-gray-300">1 an</td>
                <td className="px-4 py-2 border border-gray-300">Fonctionnalité</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Cookies tiers</h2>
        <p className="mb-4">
          En plus de nos propres cookies, nous pouvons également utiliser divers cookies tiers pour signaler les statistiques d'utilisation du site, délivrer des publicités sur et via notre site, etc.
        </p>
        <p className="mb-4">
          Ces cookies tiers comprennent :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Google Analytics (pour l'analyse d'audience)</li>
          <li>Stripe (pour le traitement des paiements)</li>
          <li>Intercom (pour le chat d'assistance)</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Comment gérer les cookies</h2>
        <p className="mb-4">
          Vous pouvez configurer votre navigateur pour refuser tous les cookies ou pour indiquer quand un cookie est envoyé. Toutefois, si vous n'acceptez pas les cookies, vous ne pourrez peut-être pas utiliser certaines parties de notre service.
        </p>
        <p className="mb-4">
          Voici comment vous pouvez gérer les cookies dans les navigateurs les plus populaires :
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>Chrome :</strong> Menu {'>'}  Paramètres {'>'}  Afficher les paramètres avancés {'>'}  Confidentialité {'>'}  Paramètres de contenu {'>'}  Cookies</li>
          <li><strong>Firefox :</strong> Menu {'>'}  Options {'>'}  Vie privée {'>'}  Historique {'>'}  Paramètres personnalisés {'>'}  Cookies</li>
          <li><strong>Safari :</strong> Préférences {'>'}  Confidentialité {'>'}  Cookies</li>
          <li><strong>Edge :</strong> Menu {'>'}  Paramètres {'>'}  Cookies et autorisations de site</li>
        </ul>
        <p className="mb-4">
          Vous pouvez également utiliser des outils comme <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Your Online Choices</a> pour gérer les cookies publicitaires.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Modifications de notre politique de cookies</h2>
        <p className="mb-4">
          Nous pouvons mettre à jour notre politique de cookies de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique de cookies sur cette page et en mettant à jour la date de "dernière mise à jour" en haut de cette politique.
        </p>
        <p className="mb-4">
          Nous vous encourageons à consulter régulièrement cette politique pour rester informé de la façon dont nous utilisons les cookies.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p className="mb-4">
          Si vous avez des questions concernant notre utilisation des cookies, veuillez nous contacter à :
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