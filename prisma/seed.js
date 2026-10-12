const prisma = require('../src/db');

async function main() {
  await prisma.role.upsert({ where: { rolename: 'ADMIN' }, update: {}, create: { rolename: 'ADMIN' } });
  await prisma.role.upsert({ where: { rolename: 'USER' }, update: {}, create: { rolename: 'USER' } });

  const levels = [
    { mid: 1, mname: 'Bronze', score: 0 },
    { mid: 2, mname: 'Silver', score: 100 },
    { mid: 3, mname: 'Gold', score: 500 },
  ];
  for (const m of levels) {
    await prisma.memberShip.upsert({ where: { mid: m.mid }, update: {}, create: m });
  }
  console.log('Seed xong');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());