
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function mark001Done() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        console.log('📝 Marking 001-initial-schema.sql as COMPLETED...');
        await client.query(`
      INSERT INTO migrations (filename, applied_at) 
      VALUES ('001-initial-schema.sql', NOW())
      ON CONFLICT (filename) DO NOTHING;
    `);

        console.log('✅ 001 marked as done. System will skip it.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

mark001Done();
