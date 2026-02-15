"use strict";

// Ce script teste l'API /api/scan/save-email en envoyant
// un faux planning complet vers http://localhost:3000.
//
// Prérequis :
// 1) `npm run dev` doit être lancé (port 3000)
// 2) Le Google Sheet est partagé avec le service account
// 3) L'API Google Sheets est activée dans la console GCP
//
// Lancement :
//   npm run test:scan-save-email

const API_URL = "http://localhost:3000/api/scan/save-email";

async function main() {
  const testEmail = "test-scan+" + Date.now() + "@example.com";

  const clarifiedTasks = [
    {
      id: "task-1",
      title: "Réviser maths chapitre 5",
      category: "Études",
      priority: 4,
      energyLevel: 3,
      dueDate: new Date().toISOString(),
      suggestedTime: "morning",
      estimatedDuration: 90,
    },
    {
      id: "task-2",
      title: "Finir rapport de stage",
      category: "Études",
      priority: 4,
      energyLevel: 2,
      dueDate: new Date().toISOString(),
      suggestedTime: "morning",
      estimatedDuration: 60,
    },
    {
      id: "task-3",
      title: "Faire à manger",
      category: "Perso",
      priority: 0,
      energyLevel: 0,
      dueDate: new Date().toISOString(),
      suggestedTime: "evening",
      estimatedDuration: 30,
    },
  ];

  const timelineTasks = [
    {
      id: "task-1",
      title: "Réviser maths chapitre 5",
      time: "08:00",
      duration: 90,
      priority: true,
      energyLevel: 3,
      category: "Études",
    },
    {
      id: "break-1",
      title: "Pause récupération",
      time: "09:30",
      duration: 15,
      priority: false,
      energyLevel: 0,
      category: "Récupération",
    },
    {
      id: "task-2",
      title: "Finir rapport de stage",
      time: "09:45",
      duration: 60,
      priority: true,
      energyLevel: 2,
      category: "Études",
    },
    {
      id: "task-3",
      title: "Faire à manger",
      time: "19:00",
      duration: 30,
      priority: false,
      energyLevel: 0,
      category: "Perso",
    },
  ];

  const body = {
    email: testEmail,
    sessionId: "scan_test_" + Date.now(),
    rawInput:
      "réviser maths chapitre 5, finir rapport de stage pour vendredi, faire à manger ce soir",
    clarifiedTasks,
    timelineTasks,
    priorities: ["Réviser maths chapitre 5", "Finir rapport de stage"],
    diagnostic: {
      totalWorkHours: 3.25,
      availableHours: 12,
      crashRatio: 0.27,
    },
  };

  console.log("➡️  Envoi du test vers", API_URL);
  console.log("Email utilisé:", testEmail);
  console.log("Données envoyées:", JSON.stringify(body, null, 2).slice(0, 400) + "...\n");

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  console.log("Status:", res.status);
  console.log("Réponse:", data);

  if (!res.ok) {
    console.error("\n❌ L'appel a échoué. Vérifie les logs du serveur Next.js.");
    process.exit(1);
  }

  console.log("\n✅ Vérifie ton Google Sheet — une nouvelle ligne devrait apparaître avec toutes les colonnes remplies.");
}

main().catch((err) => {
  console.error("❌ Erreur dans le script de test:", err);
  process.exit(1);
});
