
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkSession() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();

        const res = await client.query(`
      SELECT to_regclass('session');
    `);

        if (res.rows[0].to_regclass) {
            console.log('✅ session table EXISTS');
        } else {
            console.log('❌ session table MISSING');
            console.log('creating session table...');
            await client.query(`
        CREATE TABLE "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL
        )
        WITH (OIDS=FALSE);
        
        ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
        
        CREATE INDEX "IDX_session_expire" ON "session" ("expire");
      `);
            console.log('✅ session table CREATED');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkSession();
