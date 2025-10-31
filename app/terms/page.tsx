import React from 'react';
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Use</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
        <p className="mb-4">
          Welcome to productif.io. By accessing our website or using our services, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our services.
        </p>
        <p className="mb-4">
          productif.io is a productivity management application that helps professionals and teams organize their tasks, projects, and time, offering a comprehensive centralized service to optimize productivity.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>"We", "our", "us"</strong> refers to Noah Lugagne, sole proprietor under the micro‑enterprise regime.</li>
          <li><strong>"You", "your"</strong> refers to the user of our services.</li>
          <li><strong>"Services"</strong> means all features, tools, and offerings provided by productif.io.</li>
          <li><strong>"Content"</strong> means any information, data, text, images, or other materials you submit to our services.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">3. Registration and account</h2>
        <p className="mb-4">
          To use certain features of our services, you must create an account. You are responsible for maintaining the confidentiality of your login information and for all activities that occur under your account.
        </p>
        <p className="mb-4">
          You agree to:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Provide accurate, current, and complete information when creating your account.</li>
          <li>Promptly update your information to keep it accurate, current, and complete.</li>
          <li>Protect the security of your account and password.</li>
          <li>Notify us immediately of any unauthorized use of your account or other security breach.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">4. Use of services</h2>
        <p className="mb-4">
          You agree to use our services only for lawful purposes and in accordance with these Terms. You agree not to:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Use our services in any way that could damage, disable, overburden, or impair them.</li>
          <li>Use robots, spiders, or other automated devices to access our services.</li>
          <li>Attempt to access areas or features of our services you are not authorized to access.</li>
          <li>Introduce viruses, trojans, worms, or any other malicious code.</li>
          <li>Violate intellectual property rights or other rights of third parties.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">5. User content</h2>
        <p className="mb-4">
          You retain all rights to content you submit to our services. By submitting content, you grant us a worldwide, non‑exclusive, royalty‑free license to use, reproduce, modify, adapt, publish, and display that content solely to provide our services to you.
        </p>
        <p className="mb-4">
          You are solely responsible for any content you submit. You represent and warrant that:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>You own or have obtained all necessary rights for the content you submit.</li>
          <li>The content does not and will not infringe third‑party rights, including intellectual property and privacy rights.</li>
          <li>The content is not defamatory, obscene, offensive, or otherwise unlawful.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">6. Intellectual property</h2>
        <p className="mb-4">
          Our services and their content, features, and functionality are and will remain the exclusive property of productif.io and its licensors. Our services are protected by copyright, trademarks, and other laws in France and abroad.
        </p>
        <p className="mb-4">
          Nothing in these Terms grants you the right to use the productif.io name, trademarks, logos, domain names, or other brand features.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">7. Termination</h2>
        <p className="mb-4">
          We reserve the right to suspend or terminate your access to our services, with or without notice, for any reason, including if we reasonably believe you have violated these Terms.
        </p>
        <p className="mb-4">
          You may terminate your account at any time by following the instructions on our website. Upon termination, your right to use our services will cease immediately.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">8. Limitation of liability</h2>
        <p className="mb-4">
          To the maximum extent permitted by applicable law, productif.io will not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
        </p>
        <p className="mb-4">
          In no event will productif.io’s total liability for all claims related to the services exceed the amount you paid to productif.io in the last twelve months.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">9. Changes</h2>
        <p className="mb-4">
          We reserve the right to modify these Terms at any time. If we make material changes, we will notify you by email or by posting a notice on our website before the changes take effect.
        </p>
        <p className="mb-4">
          Your continued use of our services after the revised Terms take effect constitutes your acceptance of the revised Terms.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">10. Governing law and jurisdiction</h2>
        <p className="mb-4">
          These Terms are governed by and construed in accordance with French law. Any dispute arising out of or related to these Terms will be subject to the exclusive jurisdiction of the courts of Paris, France.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">11. Contact</h2>
        <p className="mb-4">
          If you have questions regarding these Terms, please contact us at:
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