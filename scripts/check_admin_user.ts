
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkAdmin() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const res = await client.query(`SELECT id, username, email, role, is_super_admin FROM users WHERE email = 'admin@local.dev'`);
        if (res.rows.length > 0) {
            console.log('✅ Found Default Admin:', res.rows[0]);
        } else {
            console.log('❌ admin@local.dev NOT found in DB.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkAdmin();
