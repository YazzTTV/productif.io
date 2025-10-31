import React from 'react';
import Link from 'next/link';

export default function RefundPolicy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Refund Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Introduction</h2>
        <p className="mb-4">
          At productif.io, we strive to provide quality service and ensure customer satisfaction. This refund policy sets out the conditions under which we offer refunds for our services.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Trial period</h2>
        <p className="mb-4">
          We offer a 14‑day free trial for all new users. During this period, you can explore all features of our platform with no commitment. No credit card is required for the trial.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Refund policy for monthly subscriptions</h2>
        <p className="mb-4">
          If you are dissatisfied with our services, you may request a refund within 14 days of the date of your first payment for the monthly subscription. After this 14‑day period, we do not offer refunds for ongoing monthly subscriptions.
        </p>
        <p className="mb-4">
          Please note that canceling your monthly subscription allows you to continue using our services until the end of the current billing period but prevents automatic renewal for the following month.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Refund policy for annual subscriptions</h2>
        <p className="mb-4">
          For annual subscriptions, we offer a full refund if the request is made within 30 days of the payment date. After this 30‑day period, we may offer a partial refund prorated for unused months, at our discretion.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">How to request a refund</h2>
        <p className="mb-4">
          To request a refund, please contact us at productifio@gmail.com with the following information:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Your name and account email address</li>
          <li>Your purchase date</li>
          <li>The reason for your refund request</li>
        </ul>
        <p className="mb-4">
          We will review your request and respond within 5 business days.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Exceptions</h2>
        <p className="mb-4">
          We reserve the right to refuse refund requests in the following cases:
        </p>
        <ul className="list-disc pl-8 mb-4 space-y-2">
          <li>Abusive use of our service</li>
          <li>Violation of our Terms of Use</li>
          <li>Repeated refund requests from the same customer</li>
          <li>Issues due to external factors such as internet connectivity problems, browser incompatibilities, or other technical issues not directly related to our service</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Refund timelines</h2>
        <p className="mb-4">
          Once your refund is approved, it will be processed within 10 business days. The time it takes for the amount to appear in your account depends on your financial institution and may take up to 10 additional days.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Changes to this policy</h2>
        <p className="mb-4">
          We reserve the right to modify this refund policy at any time. Changes will take effect upon publication on our website. We encourage you to check this page regularly to stay informed of updates.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Contact</h2>
        <p className="mb-4">
          If you have any questions regarding our refund policy, please contact us at:
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