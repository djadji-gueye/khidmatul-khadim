import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
if ((await db.member.count()) === 0) {
  const names = ["Jewrign (admin)", "Membre A", "Membre B", "Membre C", "Membre D"];
  const ms = [];
  for (const [i, name] of names.entries()) ms.push(await db.member.create({ data: { name, isAdmin: i === 0 } }));
  for (let j = 1; j <= 30; j++) await db.assignment.create({ data: { juz: j, memberId: ms[1 + ((j - 1) % 4)].id } });
}
const all = await db.member.findMany({ orderBy: { name: "asc" } });
console.log("\nLiens de connexion (test) :");
for (const m of all) console.log(`${m.isAdmin ? "[ADMIN] " : ""}${m.name}: http://localhost:3000/join/${m.inviteToken}`);
await db.$disconnect();
