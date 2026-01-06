
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function resetMigrationsHistory() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        // 1. TRUNCATE migrations table
        console.log('🗑️ Truncating migrations table...');
        await client.query(`TRUNCATE TABLE migrations;`);

        // 2. Read all files
        const migrationsDir = path.join(__dirname, '../migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        console.log(`📝 Inserting ${files.length} migration records...`);

        // 3. Insert all
        for (const file of files) {
            await client.query(`
            INSERT INTO migrations (filename, applied_at) 
            VALUES ($1, NOW());
        `, [file]);
        }

        console.log('✅ HISTORY SYNCED. Server will skip all existing migrations.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

resetMigrationsHistory();
