import { db, schema } from './client';
import { eq } from 'drizzle-orm';

async function seed() {
  const statuses = [
    { code: 'submitted', name: 'Submitted', description: 'Solicitud creada', isFinal: false, displayOrder: 1 },
    { code: 'under_review', name: 'Under Review', description: 'En revisión', isFinal: false, displayOrder: 2 },
    { code: 'approved', name: 'Approved', description: 'Aprobada', isFinal: true, displayOrder: 3 },
    { code: 'rejected', name: 'Rejected', description: 'Rechazada', isFinal: true, displayOrder: 4 },
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

  console.log('Seed completed');
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
