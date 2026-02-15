/**
 * Script pour décoder GOOGLE_SERVICE_ACCOUNT_JSON_B64 (version CommonJS)
 *
 * Usage :
 *   node scripts/decode-google-service-account.cjs
 *   node scripts/decode-google-service-account.cjs > service-account.json
 *
 * Prérequis :
 *   - Avoir défini GOOGLE_SERVICE_ACCOUNT_JSON_B64 dans votre .env ou vos variables d'environnement.
 */

require("dotenv").config()

function main() {
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64

  if (!b64 || b64 === "CHANGER_CETTE_VALEUR_PAR_VOTRE_BASE64") {
    console.error(
      "GOOGLE_SERVICE_ACCOUNT_JSON_B64 n'est pas défini ou contient encore la valeur de placeholder."
    )
    process.exit(1)
  }

  try {
    const jsonString = Buffer.from(b64, "base64").toString("utf8")

    // Vérifier que c'est bien du JSON
    const parsed = JSON.parse(jsonString)

    // Afficher le JSON prettifié sur stdout
    console.log(JSON.stringify(parsed, null, 2))
  } catch (error) {
    console.error("Erreur lors du décodage de GOOGLE_SERVICE_ACCOUNT_JSON_B64 :", error)
    process.exit(1)
  }
}

main()

