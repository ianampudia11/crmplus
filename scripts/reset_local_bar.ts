
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function resetUser() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();

        // Upsert the user bar@eto.com
        await client.query(`
      INSERT INTO users (
        email, username, password, full_name, role, is_super_admin, company_id, created_at, active
      ) VALUES (
        'bar@eto.com',
        'bar@eto.com',
        'PLAIN:as12345',
        'Bar User',
        'admin',
        TRUE,
        1,
        NOW(),
        TRUE
      )
      ON CONFLICT (username) DO UPDATE SET -- Assuming username constraint, or email. Schema says username is NOT NULL, likely unique? Schema actually doesn't say username is unique in the glimpse I saw, usually email is.
      -- Let's assume conflict on ID or Username. Let's try to update by Email first.
        password = 'PLAIN:as12345',
        active = TRUE;
    `);

        // Actually, upsert is tricky without knowing exact constraints. 
        // Let's UPDATE first, if 0 rows, then INSERT.
        const res = await client.query(`
      UPDATE users SET password = 'PLAIN:as12345', active = TRUE WHERE email = 'bar@eto.com' OR username = 'bar@eto.com' RETURNING id;
    `);

        if (res.rowCount === 0) {
            console.log('User not found, creating...');
            // Ensure company 1 exists
            await client.query(`INSERT INTO companies (id, name, slug, active) VALUES (1, 'System', 'system', true) ON CONFLICT (id) DO NOTHING`);

            await client.query(`
        INSERT INTO users (username, email, password, full_name, role, is_super_admin, company_id, active)
        VALUES ('bar@eto.com', 'bar@eto.com', 'PLAIN:as12345', 'Bar User', 'admin', true, 1, true);
       `);
        }

        console.log('✅ User bar@eto.com ready with password "as12345"');

    } catch (err) {
        console.error('Error resetting user:', err);
    } finally {
        await client.end();
    }
}

resetUser();
