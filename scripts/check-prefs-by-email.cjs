// Utility script to inspect notification settings by email
// Usage: node scripts/check-prefs-by-email.cjs "user@example.com"

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const email = process.argv[2];
    if (!email) {
      console.error('Usage: node scripts/check-prefs-by-email.cjs "email"');
      process.exit(2);
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { notificationSettings: true }
    });

    if (!user) {
      console.log(JSON.stringify({ found: false, email }, null, 2));
      return;
    }

    const ns = user.notificationSettings;
    console.log(JSON.stringify({
      found: true,
      id: user.id,
      email: user.email,
      startHour: ns ? ns.startHour : null,
      endHour: ns ? ns.endHour : null,
      allowedDays: ns ? ns.allowedDays : null,
      timezone: ns ? ns.timezone || null : null
    }, null, 2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();


