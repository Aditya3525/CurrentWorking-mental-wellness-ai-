const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Running manual migration...\n');

  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '..', 'prisma', 'migrations', '20251014000000_enhance_content_recommendations', 'migration.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    // Import Database class
    const Database = require('better-sqlite3');
    const db = new Database(path.join(__dirname, '..', 'prisma', 'dev.db'));

    let executed = 0;
    for (const statement of statements) {
      try {
        db.exec(statement);
        executed++;
        console.log(`✅ Executed statement ${executed}/${statements.length}`);
      } catch (error) {
        console.error(`❌ Failed to execute statement ${executed + 1}:`, error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        throw error;
      }
    }

    db.close();

    console.log(`\n✨ Migration completed successfully!`);
    console.log(`\nNext steps:`);
    console.log(`1. Run: npx prisma generate`);
    console.log(`2. Update _prisma_migrations table`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

runMigration().catch((e) => {
  console.error(e);
  process.exit(1);
});
