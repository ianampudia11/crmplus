
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixBackupSchedules() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        console.log('🛠️ Adding enabled column to backup_schedules...');
        await client.query(`ALTER TABLE backup_schedules ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;`);

        // Also drop the index if it partially exists to be safe?
        // await client.query(`DROP INDEX IF EXISTS idx_backup_schedules_enabled;`);

        console.log('✅ FIX COMPLETE.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

fixBackupSchedules();
