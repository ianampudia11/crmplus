
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function verifyColumns() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();

        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);

        console.log('--- USERS TABLE COLUMNS ---');
        console.table(res.rows);

        const hasMobile = res.rows.some(r => r.column_name === 'mobile_phone');
        if (hasMobile) {
            console.log('✅ mobile_phone column EXISTS');
        } else {
            console.log('❌ mobile_phone column MISSING');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

verifyColumns();
