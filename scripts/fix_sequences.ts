
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixSequences() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        console.log('🛠️ Resetting Sequences...');
        await client.query(`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));`);
        await client.query(`SELECT setval('companies_id_seq', COALESCE((SELECT MAX(id) FROM companies), 1));`);
        await client.query(`SELECT setval('contacts_id_seq', COALESCE((SELECT MAX(id) FROM contacts), 1));`);
        await client.query(`SELECT setval('plans_id_seq', COALESCE((SELECT MAX(id) FROM plans), 1));`);

        console.log('✅ Sequences Synced.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

fixSequences();
