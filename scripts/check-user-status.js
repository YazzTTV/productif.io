const { PrismaClient } = require('@prisma/client');

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/check-user-status.js <email>');
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        subscriptionEndDate: true,
        cancelledAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      console.log(`User not found for email: ${email}`);
      return;
    }

    console.log('User status:');
    console.log(JSON.stringify(user, null, 2));
  } catch (err) {
    console.error('Error fetching user:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };


