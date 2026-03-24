const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: "admin@test.com" },
    select: { email: true, role: true, passwordHash: true },
  });

  if (!admin) {
    console.log("NO_ADMIN_USER");
    return;
  }

  const ok = await bcrypt.compare("admin123", admin.passwordHash);
  console.log(JSON.stringify({ email: admin.email, role: admin.role, password_admin123: ok }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
