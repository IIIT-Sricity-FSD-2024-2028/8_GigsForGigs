import "dotenv/config";
import { prisma } from "./index.js";
(async () => {
  const inv = await prisma.managerInvite.findFirst({ where: { status: "pending" } });
  console.log(inv?.email ?? "");
  await prisma.$disconnect();
})();
