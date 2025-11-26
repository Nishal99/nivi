import fs from 'fs/promises';
import path from 'path';
import connection from '../database/database.mjs';

async function applyMigrations() {
  const migrationsDir = path.resolve(new URL(import.meta.url).pathname, '..', '..', '..', 'migrations');
  console.log('Migrations directory:', migrationsDir);

  let files;
  try {
    files = await fs.readdir(migrationsDir);
  } catch (err) {
    console.error('Failed to read migrations directory:', err.message || err);
    process.exit(1);
  }

  // Filter .sql files and sort alphabetically to apply in a predictable order
  const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();

  if (sqlFiles.length === 0) {
    console.log('No migration SQL files found in', migrationsDir);
    process.exit(0);
  }

  for (const file of sqlFiles) {
    const filePath = path.join(migrationsDir, file);
    console.log('--> Applying migration:', file);
    try {
      const sql = await fs.readFile(filePath, { encoding: 'utf8' });
      // Run statements; allow multiple statements if present
      // Using connection.query to run the SQL; queries may contain DELIMITER and event creations in schema.sql — those may fail.
      // Migrations here should be idempotent (use IF NOT EXISTS) and not rely on DELIMITER blocks.
      const [result] = await connection.query(sql);
      console.log('  ok —', (result && result.affectedRows ? `${result.affectedRows} affected` : 'no direct affectedRows info'));
    } catch (err) {
      console.error(`  failed: ${err.message || err}`);
      // Continue to next migration because some SQL files (like schema.sql) may not be safe to run by script
    }
  }

  console.log('Migrations completed');
  process.exit(0);
}

applyMigrations().catch(err => {
  console.error('Migration runner failed:', err && err.message ? err.message : err);
  process.exit(1);
});
