import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const arg = process.argv[2];

  if (arg === 'migrate') {
    // Run specific migrations
    const migrations = [
      'ALTER TABLE "Kid" ADD COLUMN "parentName" TEXT',
      'ALTER TABLE "Kid" ADD COLUMN "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP',
    ];

    console.log('Running migrations...');
    for (const sql of migrations) {
      try {
        await client.execute(sql);
        console.log('✓', sql);
      } catch (err: any) {
        if (!err.message?.includes('duplicate column')) {
          console.log('⚠', err.message);
        }
      }
    }
    console.log('\n✅ Migrations complete!');
  } else {
    // Initial schema push
    const { readFileSync } = await import('fs');
    const { join } = await import('path');

    console.log('Pushing schema to Turso...');
    const migrationPath = join(process.cwd(), 'prisma/migrations/20260216195041_init/migration.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      try {
        await client.execute(statement);
        console.log('✓', statement.substring(0, 50) + '...');
      } catch (err: any) {
        if (!err.message?.includes('already exists')) {
          console.error('Error:', err.message);
        }
      }
    }
    console.log('\n✅ Schema pushed to Turso!');
  }
}

main().catch(console.error);
