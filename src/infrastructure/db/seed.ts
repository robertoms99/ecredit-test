import { RequestStatusCodes } from '../../domain/entities';
import { db, schema } from './client';
import { eq } from 'drizzle-orm';

async function seed() {
  const statuses = [
    { code: RequestStatusCodes.CREATED, name: 'Creada', description: 'Solicitud creada', isFinal: false, displayOrder: 1 },
    { code: RequestStatusCodes.PENDING_FOR_BANK_DATA, name: 'Pendiente de datos bancarios', description: 'Esperando respuesta del proveedor', isFinal: false, displayOrder: 2 },
    { code: RequestStatusCodes.EVALUATING, name: 'En evaluación', description: 'En revisión', isFinal: false, displayOrder: 3 },
    { code: RequestStatusCodes.APPROVED, name: 'Aprobada', description: 'Aprobada', isFinal: true, displayOrder: 4 },
    { code: RequestStatusCodes.REJECTED, name: 'Rechazada', description: 'Rechazada', isFinal: true, displayOrder: 5 },
  ];
  for (const s of statuses) {
    await db.insert(schema.requestStatuses)
      .values({
        code: s.code,
        name: s.name,
        description: s.description,
        isFinal: s.isFinal,
        displayOrder: s.displayOrder,
      })
      .onConflictDoNothing();
  }

  const adminEmail = 'admin@example.com';
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, adminEmail));
  if (existing.length === 0) {
    await db.insert(schema.users).values({
      email: adminEmail,
      passwordHash: 'changeme123456',
      fullName: 'Admin User',
      role: 'admin',
      isActive: true,
    });
  }

  // Add test users for each country (matching provider-sim test users)
  // Note: documentId is provided when creating credit request, not stored in user table
  const testUsers = [
    // Mexico test users
    {
      email: 'good.mexico@test.com',
      passwordHash: 'test123456',
      fullName: 'Good Mexico User',
      role: 'client' as const,
      isActive: true,
    },
    {
      email: 'bad.mexico@test.com',
      passwordHash: 'test123456',
      fullName: 'Bad Mexico User',
      role: 'client' as const,
      isActive: true,
    },
    // Colombia test users
    {
      email: 'good.colombia@test.com',
      passwordHash: 'test123456',
      fullName: 'Good Colombia User',
      role: 'client' as const,
      isActive: true,
    },
    {
      email: 'bad.colombia@test.com',
      passwordHash: 'test123456',
      fullName: 'Bad Colombia User',
      role: 'client' as const,
      isActive: true,
    },
  ];

  for (const user of testUsers) {
    const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, user.email));
    if (existingUser.length === 0) {
      await db.insert(schema.users).values(user);
      console.log(`✓ Created test user: ${user.email}`);
    }
  }

  console.log('\n✅ Seed completed');
  console.log('\n📋 Test Users & Document IDs (for provider-sim):');
  console.log('   Mexico (MX):');
  console.log('     - good.mexico@test.com    → Use CURP: GOMC860101HDFRRA09 (Expected: APPROVED, score 750)');
  console.log('     - bad.mexico@test.com     → Use CURP: BAPC901215MDFRRS03 (Expected: REJECTED, score 450)');
  console.log('   Colombia (CO):');
  console.log('     - good.colombia@test.com  → Use CC: 1234567890 (Expected: APPROVED, score 680)');
  console.log('     - bad.colombia@test.com   → Use CC: 9876543210 (Expected: REJECTED, score 400)');
  console.log('');
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
