import { prisma } from "@/lib/prisma";
import { inferHabitCategory, HabitCategory } from "@/lib/habits-utils";

async function main() {
  console.log("🔄 Backfill des catégories d'habitudes (inferredCategory)...");

  const habits = await prisma.habit.findMany({
    where: {
      inferredCategory: null,
    },
  });

  console.log(`📋 ${habits.length} habitude(s) à catégoriser`);

  for (const habit of habits) {
    const inferred = inferHabitCategory(habit.name, habit.description) as HabitCategory;
    await prisma.habit.update({
      where: { id: habit.id },
      data: { inferredCategory: inferred },
    });
    console.log(`✅ ${habit.name} → ${inferred}`);
  }

  console.log("✨ Backfill terminé");
}

main()
  .catch((err) => {
    console.error("❌ Erreur backfill habits:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


