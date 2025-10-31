import React from 'react';
import Link from 'next/link';

export default function LegalNotice() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Legal Notice</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">1. Website publisher</h2>
        <p className="mb-4">
          The website productif.io is published by Noah Lugagne, a sole proprietor under the micro‑enterprise regime, with registered office at 397 bis route de montpellier, 34730 Prade‑le‑Lez, France.
        </p>
        <p className="mb-4">
          Publication director: Noah Lugagne
        </p>
        <p className="mb-4">
          Contact email: productifio@gmail.com
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">2. Hosting</h2>
        <p className="mb-4">
          The website productif.io is hosted by Vercel Inc., headquartered at 340 S Lemon Ave #4133, Walnut, CA 91789, United States.
        </p>
        <p className="mb-4">
          Host website: vercel.com
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">3. Intellectual property</h2>
        <p className="mb-4">
          All content of productif.io (architecture, texts, logos, images, photographs, illustrations, etc.) is the exclusive property of [Your company name] or its partners and is protected by French and international intellectual property laws.
        </p>
        <p className="mb-4">
          Any reproduction, representation, distribution, or redistribution, in whole or in part, of the content of this site by any process whatsoever, without the prior express authorization of [Your company name], is prohibited and would constitute infringement under Articles L.335‑2 et seq. of the French Intellectual Property Code.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">4. Personal data</h2>
        <p className="mb-4">
          Personal information collected on the productif.io website is necessary for the proper functioning of the services. This information is intended exclusively for Noah Lugagne and will not be transferred to third parties without your express consent.
        </p>
        <p className="mb-4">
          In accordance with the French Data Protection Act of January 6, 1978 as amended, the General Data Protection Regulation (GDPR), and the Digital Republic Act of October 7, 2016, you have the right to access, rectify, delete, limit, port, and object to the processing of your personal data.
        </p>
        <p className="mb-4">
          To exercise these rights, you can contact us at: [contact email address] or by mail at [company postal address].
        </p>
        <p className="mb-4">
          For more information on how we process your data, please see our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">5. Cookies</h2>
        <p className="mb-4">
          The productif.io website uses cookies to improve the user experience and collect traffic statistics. You can disable cookies by changing your browser settings.
        </p>
        <p className="mb-4">
          To learn more about our use of cookies, please see our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">6. Governing law and jurisdiction</h2>
        <p className="mb-4">
          This legal notice is governed by French law. In case of dispute, the French courts shall have exclusive jurisdiction.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">7. Contact</h2>
        <p className="mb-4">
          For any questions regarding this legal notice, you can contact us at:
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