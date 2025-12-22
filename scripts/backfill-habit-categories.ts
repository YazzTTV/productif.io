import { prisma } from "@/lib/prisma";
import { inferHabitCategory, HabitCategory } from "@/lib/habits-utils";

async function main() {
  console.log("🔄 Backfill des catégories d'habitudes (inferredCategory)...");

  const habits = await prisma.habit.findMany({
    where: {},
  });

  console.log(`📋 ${habits.length} habitude(s) à catégoriser`);

  let updatedCount = 0;
  const sample: {
    id: string;
    name: string;
    inferredCategory: HabitCategory;
  }[] = [];

  for (const habit of habits) {
    const inferred = inferHabitCategory(habit.name, habit.description) as HabitCategory;

    await prisma.habit.update({
      where: { id: habit.id },
      data: { inferredCategory: inferred },
    });

    updatedCount += 1;
    if (sample.length < 5) {
      sample.push({
        id: habit.id,
        name: habit.name,
        inferredCategory: inferred,
      });
    }
  }

  console.log(`✅ Backfill terminé. Habitudes mises à jour: ${updatedCount}`);
  if (sample.length > 0) {
    console.log("🧪 Échantillon d'habitudes mises à jour (max 5):");
    for (const h of sample) {
      console.log(`- ${h.id} | ${h.name} | inferredCategory=${h.inferredCategory}`);
    }
  }
}

main()
  .catch((err) => {
    console.error("❌ Erreur backfill habits:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

