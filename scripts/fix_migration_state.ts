
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixMigrationState() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        console.log('🛠️ Deleting corrupted migration record for 001...');
        const res = await client.query(`DELETE FROM migrations WHERE filename = '001-initial-schema.sql'`);
        console.log(`✅ Deleted ${res.rowCount} rows. Migration system can now replay it safely.`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

fixMigrationState();
