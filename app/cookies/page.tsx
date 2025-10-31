import React from 'react';
import Link from 'next/link';

export default function CookiePolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Cookies Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          This cookies policy explains how productif.io uses cookies and similar technologies to recognize your device when you visit our website and use our services. It details the different types of cookies we use, why we use them, and how you can exercise your rights to control our use of cookies.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">What is a cookie?</h2>
        <p className="mb-4">
          A cookie is a small text file placed on your device (computer, tablet, or mobile phone) when you visit a website. Cookies are widely used by website owners to make their sites work, to work more efficiently, and to provide reporting information.
        </p>
        <p className="mb-4">
          Cookies typically do not contain any information that personally identifies a user, but personal information that we store about you may be linked to the information stored in and obtained from cookies.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">How do we use cookies?</h2>
        <p className="mb-4">
          We use different types of cookies for the following reasons:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>Strictly necessary cookies:</strong> Essential to enable you to move around our site and use its features. Without these cookies, services you have asked for, like remembering your login details, cannot be provided.</li>
          <li><strong>Performance and analytics cookies:</strong> Allow us to recognize and count the number of visitors and to see how visitors move around our site when using it. This helps us improve how our site works.</li>
          <li><strong>Functionality cookies:</strong> Used to recognize you when you return to our site. This enables us to personalize our content for you and remember your preferences (e.g., language or region).
          </li>
          <li><strong>Targeting cookies:</strong> Record your visit to our site, the pages you have visited, and the links you have followed to make our site and advertising more relevant to your interests.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Cookies we use</h2>
        <p className="mb-4">
          Voici une liste détaillée des cookies que nous utilisons et leur finalité :
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border border-gray-300 text-left">Cookie name</th>
                <th className="px-4 py-2 border border-gray-300 text-left">Purpose</th>
                <th className="px-4 py-2 border border-gray-300 text-left">Duration</th>
                <th className="px-4 py-2 border border-gray-300 text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 border border-gray-300">auth_token</td>
                <td className="px-4 py-2 border border-gray-300">Authentication and user session</td>
                <td className="px-4 py-2 border border-gray-300">30 jours</td>
                <td className="px-4 py-2 border border-gray-300">Strictement nécessaire</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">_ga</td>
                <td className="px-4 py-2 border border-gray-300">Google Analytics - Distinguish users</td>
                <td className="px-4 py-2 border border-gray-300">2 ans</td>
                <td className="px-4 py-2 border border-gray-300">Performance</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">_gid</td>
                <td className="px-4 py-2 border border-gray-300">Google Analytics - Distinguish users</td>
                <td className="px-4 py-2 border border-gray-300">24 heures</td>
                <td className="px-4 py-2 border border-gray-300">Performance</td>
              </tr>
              <tr>
                <td className="px-4 py-2 border border-gray-300">preferences</td>
                <td className="px-4 py-2 border border-gray-300">Remember user preferences</td>
                <td className="px-4 py-2 border border-gray-300">1 an</td>
                <td className="px-4 py-2 border border-gray-300">Fonctionnalité</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Third‑party cookies</h2>
        <p className="mb-4">
          In addition to our own cookies, we may also use various third‑party cookies to report site usage statistics, deliver advertisements on and through our site, etc.
        </p>
        <p className="mb-4">
          These third‑party cookies include:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Google Analytics (pour l'analyse d'audience)</li>
          <li>Stripe (pour le traitement des paiements)</li>
          <li>Intercom (pour le chat d'assistance)</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">How to manage cookies</h2>
        <p className="mb-4">
          You can set your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, some parts of our service may not function properly.
        </p>
        <p className="mb-4">
          Here’s how you can manage cookies in popular browsers:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>Chrome :</strong> Menu {'>'}  Paramètres {'>'}  Afficher les paramètres avancés {'>'}  Confidentialité {'>'}  Paramètres de contenu {'>'}  Cookies</li>
          <li><strong>Firefox :</strong> Menu {'>'}  Options {'>'}  Vie privée {'>'}  Historique {'>'}  Paramètres personnalisés {'>'}  Cookies</li>
          <li><strong>Safari :</strong> Préférences {'>'}  Confidentialité {'>'}  Cookies</li>
          <li><strong>Edge :</strong> Menu {'>'}  Paramètres {'>'}  Cookies et autorisations de site</li>
        </ul>
        <p className="mb-4">
          You can also use tools like <a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Your Online Choices</a> to manage advertising cookies.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Changes to our cookies policy</h2>
        <p className="mb-4">
          We may update our cookies policy from time to time. We will notify you of any changes by posting the new cookies policy on this page and updating the “last updated” date at the top of this policy.
        </p>
        <p className="mb-4">
          We encourage you to review this policy regularly to stay informed about how we use cookies.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p className="mb-4">
          If you have questions about our use of cookies, please contact us at:
        </p>
        <p className="mb-4">
          Email: productifio@gmail.com<br />
          Address: 397 bis route de montpellier, 34730 Prade‑le‑Lez, France
        </p>
      </section>

      <div className="mt-12 border-t pt-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Back to home
        </Link>
      </div>
    </div>
  );
} 