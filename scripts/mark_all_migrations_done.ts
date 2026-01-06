
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function markAllMigrationsDone() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        const migrationsDir = path.join(__dirname, '../migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        console.log(`📝 Marking ${files.length} migrations as COMPLETED...`);

        for (const file of files) {
            await client.query(`
        INSERT INTO migrations (filename, applied_at) 
        VALUES ($1, NOW())
        ON CONFLICT (filename) DO NOTHING;
        `, [file]);
        }

        console.log('✅ All migrations marked as done. Usage of existing schema confirmed.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

markAllMigrationsDone();
