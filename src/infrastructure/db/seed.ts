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

  console.log('Seed completed');
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
