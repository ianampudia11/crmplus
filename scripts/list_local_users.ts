
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listUsers() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        const res = await client.query('SELECT id, email, username, role, active FROM users');
        console.log('--- USERS IN LOCAL DB ---');
        console.table(res.rows);
        console.log('-------------------------');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

listUsers();
