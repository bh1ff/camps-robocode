import 'dotenv/config';
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('Pushing schema to Turso...');

  const migrationPath = join(process.cwd(), 'prisma/migrations/20260216195041_init/migration.sql');
  const sql = readFileSync(migrationPath, 'utf-8');

  // Split by statements and execute each
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    try {
      await client.execute(statement);
      console.log('✓', statement.substring(0, 50) + '...');
    } catch (err: any) {
      // Ignore "table already exists" errors
      if (!err.message?.includes('already exists')) {
        console.error('Error:', err.message);
      }
    }
  }

  console.log('\n✅ Schema pushed to Turso!');
}

main().catch(console.error);
