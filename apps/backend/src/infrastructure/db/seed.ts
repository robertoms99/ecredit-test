import { db, schema } from './client';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../auth/jwt';
import { RequestStatusCodes } from '../../domain/entities';

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

  const adminUsers = [
    {
      email: 'admin1@ecredit.com',
      password: 'admin123456',
      fullName: 'Administrador Principal',
      role: 'admin' as const,
    },
    {
      email: 'admin2@ecredit.com',
      password: 'admin123456',
      fullName: 'Administrador Secundario',
      role: 'admin' as const,
    },
  ];

  for (const admin of adminUsers) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, admin.email));
    if (existing.length === 0) {
      const hashedPassword = await hashPassword(admin.password);
      await db.insert(schema.users).values({
        email: admin.email,
        passwordHash: hashedPassword,
        fullName: admin.fullName,
        role: admin.role,
        isActive: true,
      });
      console.log(`✓ Created admin user: ${admin.email}`);
    }
  }

  console.log('\n✅ Seed completed');
  console.log('\n📋 Administrator Users:');
  console.log('   These administrators manage credit requests on behalf of clients.');
  console.log('   Each admin can only see their own created requests.\n');
  console.log('   Admin 1:');
  console.log('     - Email: admin1@ecredit.com');
  console.log('     - Password: admin123456');
  console.log('');
  console.log('   Admin 2:');
  console.log('     - Email: admin2@ecredit.com');
  console.log('     - Password: admin123456');
}

if (import.meta.main) {
  seed()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
