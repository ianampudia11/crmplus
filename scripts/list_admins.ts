
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listAdmins() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        const res = await client.query(`
        SELECT id, username, email, role, is_super_admin, company_id 
        FROM users 
        WHERE role = 'admin' OR is_super_admin = TRUE
    `);

        console.log('\n👑 Admin Users Found:');
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

listAdmins();
