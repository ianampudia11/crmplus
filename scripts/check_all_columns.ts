
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSchema() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();

        const res = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `);

        fs.writeFileSync('users_schema.json', JSON.stringify(res.rows, null, 2));
        console.log('Schema saved to users_schema.json');

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkSchema();
