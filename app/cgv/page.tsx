import React from 'react';
import Link from 'next/link';

export default function CGV() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">1. Purpose</h2>
        <p className="mb-4">
          These Terms & Conditions govern the contractual relationship between Noah Lugagne, sole proprietor under the micro‑enterprise regime (the “Provider”), and any natural or legal person (the “Customer”) subscribing to a subscription or purchasing services on the productif.io website (the “Service”).
        </p>
        <p className="mb-4">
          Any subscription or purchase implies the Customer’s unreserved acceptance of these Terms & Conditions. These T&C prevail over any other Customer document.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">2. Service description</h2>
        <p className="mb-4">
          Productif.io is a productivity management application that helps users manage tasks, projects, time, and habits. The service provides comprehensive centralization and organization features to optimize personal and professional productivity.
        </p>
        <p className="mb-4">
          The Service is offered as a subscription under the terms presented on the website.
        </p>
        <p className="mb-4">
          The Provider reserves the right to evolve features and services offered without this constituting a substantial modification of the T&C.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">3. Pricing and payment terms</h2>
        <p className="mb-4">
          Service prices are indicated in euros. The Provider reserves the right to modify prices at any time. New prices will apply to any new contract or renewal after the modification date.
        </p>
        <p className="mb-4">
          Payment is made by credit card, direct debit, or any other payment method offered on the site. For subscriptions, payment is recurring and automatic at the intervals indicated at the time of subscription.
        </p>
        <p className="mb-4">
          In case of late or non‑payment, the Provider reserves the right to suspend access to the Service until regularization.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">4. Term and renewal</h2>
        <p className="mb-4">
          The subscription is entered into for the duration chosen by the Customer (monthly or annual). At the end of this period, the subscription is automatically renewed for an identical duration, unless terminated by the Customer under section 5.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">5. Termination</h2>
        <p className="mb-4">
          The Customer may terminate their subscription at any time from their account. Termination will take effect at the end of the current subscription period; no refund will be made for the remaining period except as specified in our <Link href="/refund-policy" className="text-blue-600 hover:underline">Refund Policy</Link>.
        </p>
        <p className="mb-4">
          The Provider may terminate or suspend the Customer’s account and right to use the Service immediately and without notice in case of breach of these T&C.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">6. Right of withdrawal</h2>
        <p className="mb-4">
          In accordance with applicable legal provisions, consumer Customers have a 14‑day period from subscription to exercise their right of withdrawal without having to provide reasons or pay penalties.
        </p>
        <p className="mb-4">
          If the right of withdrawal is exercised, the Provider will refund the Customer in full within 14 days from the date the right was exercised.
        </p>
        <p className="mb-4">
          The right of withdrawal cannot be exercised for services fully performed before the end of the withdrawal period and whose performance began after the Customer’s prior express consent and express waiver of the right of withdrawal.
        </p>
        <p className="mb-4">
          Productif.io also offers a 14‑day free trial for all new users, allowing you to test all features with no commitment.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">7. Availability and maintenance</h2>
        <p className="mb-4">
          The Provider strives to ensure the highest possible availability of the Service. However, continuous availability cannot be guaranteed and access may be temporarily interrupted for maintenance, updates, or improvements.
        </p>
        <p className="mb-4">
          Where possible, the Provider will notify the Customer in advance of any scheduled interruptions.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">8. Liability</h2>
        <p className="mb-4">
          The Provider undertakes to use all necessary means to ensure a quality service. However, the Provider cannot be held liable in the event of:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Temporary service interruption for maintenance</li>
          <li>Internet network failure or malfunction</li>
          <li>Data loss or indirect damages</li>
          <li>Use of the Service not in accordance with these T&C</li>
        </ul>
        <p className="mb-4">
          The Provider’s liability, if established, will be limited to the amount actually paid by the Customer for the current subscription.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">9. Intellectual property</h2>
        <p className="mb-4">
          All elements of the Service, including without limitation texts, graphics, logos, icons, images, audio clips, and software, are the exclusive property of the Provider or its partners and are protected by French and international intellectual property laws.
        </p>
        <p className="mb-4">
          Any reproduction, distribution, modification, adaptation, retransmission, or publication of these elements is strictly prohibited without the Provider’s prior written consent.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">10. Personal data protection</h2>
        <p className="mb-4">
          The Provider is committed to respecting Customers’ privacy and processing their personal data in accordance with applicable legislation, including the General Data Protection Regulation (GDPR).
        </p>
        <p className="mb-4">
          For more information on how we process your data, please see our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">11. Governing law and jurisdiction</h2>
        <p className="mb-4">
          These T&C are governed by French law. In the event of a dispute, an amicable solution will be sought before any legal action. Failing that, the French courts shall have exclusive jurisdiction.
        </p>
        <p className="mb-4">
          In accordance with the Consumer Code provisions on amicable dispute resolution, the Customer may use the mediation service offered by the Provider. The mediator will attempt, independently and impartially, to bring the parties together to reach an amicable solution.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
        <p className="mb-4">
          For any questions regarding these T&C, please contact us at:
        </p>
        <p className="mb-4">
          Email: productifio@gmail.com<br />
          Adresse: 397 bis route de montpellier, 34730 Prade-le-Lez, France
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