import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          At productif.io, we respect your privacy and are committed to protecting your personal data. 
          This privacy policy explains how we process your personal data when you visit our website or use our services, regardless of the channel or medium used.
        </p>
        <p className="mb-4">
          The data controller is Noah Lugagne, sole proprietor under the micro‑enterprise regime, 
          residing at 397 bis route de montpellier, 34730 Prade‑le‑Lez, France.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Data we collect</h2>
        <p className="mb-4">
          We may collect, use, store, and transfer different kinds of personal data about you:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>Identity data:</strong> first name, last name, username or similar identifier.</li>
          <li><strong>Contact data:</strong> email address, phone number, postal address.</li>
          <li><strong>Technical data:</strong> IP address, login data, browser type and version, time zone, plug‑in types and versions, operating system and platform.</li>
          <li><strong>Usage data:</strong> information about how you use our website and services.</li>
          <li><strong>Marketing and communications data:</strong> your preferences in receiving marketing from us and your communication preferences.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">How we use your data</h2>
        <p className="mb-4">
          We use your personal data only when the law allows us to. Most commonly, we use your personal data in the following circumstances:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
          <li>Where it is necessary for our legitimate interests (or those of a third party) and your fundamental rights do not override those interests.</li>
          <li>Where we need to comply with a legal or regulatory obligation.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Sharing your personal data</h2>
        <p className="mb-4">
          We may share your personal data with the following parties:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Service providers who provide IT and system administration services.</li>
          <li>Our professional advisers including lawyers, bankers, auditors, and insurers.</li>
          <li>Tax and regulatory authorities who require reporting in certain circumstances.</li>
        </ul>
        <p className="mb-4">
          We require all third parties to respect the security of your personal data and to treat it in accordance with the law. We do not allow our third‑party service providers to use your personal data for their own purposes.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Data security</h2>
        <p className="mb-4">
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered, or disclosed. We also limit access to your personal data to employees, agents, contractors, and other third parties who have a business need to know.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Data retention</h2>
        <p className="mb-4">
          We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for legal, accounting, or reporting requirements.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Your legal rights</h2>
        <p className="mb-4">
          In certain circumstances, you have rights under data protection laws in relation to your personal data:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li><strong>Right of access:</strong> request a copy of the personal information we hold about you.</li>
          <li><strong>Right to rectification:</strong> request correction of inaccurate personal information we hold about you.</li>
          <li><strong>Right to erasure:</strong> request deletion of your personal information where there is no good reason for us to continue processing it.</li>
          <li><strong>Right to object:</strong> object to processing of your personal information.</li>
          <li><strong>Right to data portability:</strong> request transfer of your personal information to you or to a third party.</li>
        </ul>
        <p className="mb-4">
          If you wish to exercise any of these rights, please contact us at contact@productif.io.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Changes to this privacy policy</h2>
        <p className="mb-4">
          We reserve the right to update this privacy policy at any time. We will post any updates on this page and, if the changes are significant, we will notify you by email.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Contact us</h2>
        <p className="mb-4">
          If you have questions about this privacy policy or our privacy practices, please contact us at:
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