import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Productif.io Support",
  description: "Page de support officielle de Productif.io : aide abonnement, connexion et délais de réponse.",
}

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-6">
            Productif.io Support
          </h1>

          <div className="space-y-4 text-gray-800">
            <p className="text-lg">
              Vous pouvez contacter notre équipe à l&apos;adresse suivante :
            </p>
            <p className="text-lg font-medium">
              support@productif.io
            </p>

            <div className="pt-6 space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Aide disponible
              </h2>
              <ul className="list-disc list-inside space-y-1 text-base">
                <li>aide abonnement</li>
                <li>aide connexion</li>
                <li>délai réponse</li>
              </ul>
            </div>

            <div className="pt-6 space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                Délai de réponse
              </h2>
              <p className="text-base">
                Nous faisons de notre mieux pour répondre à tous les messages sous 48&nbsp;heures ouvrées.
              </p>
            </div>

            <div className="pt-6 space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                FAQ rapide
              </h2>
              <p className="text-base font-medium">
                Comment gérer mon abonnement&nbsp;?
              </p>
              <p className="text-base">
                Pour toute question liée à la facturation ou à l&apos;annulation, écrivez simplement à{" "}
                <span className="font-medium">support@productif.io</span> avec l&apos;adresse e-mail utilisée pour votre compte.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

