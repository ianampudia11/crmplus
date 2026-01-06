
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixAggressive() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        // 1. Ensure Columns (Idempotent)
        console.log('🛠️ Checking Schema...');
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_phone TEXT;`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"whatsapp": false, "email": true}';`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';`);

        // 2. Ensure Role Enum exists (if not, we might be in trouble, but let's assume it is or cast to text)
        // We won't touch enums to avoid breaking types.

        // 3. Ensure Company 1
        console.log('🏢 ensuring Company 1...');
        await client.query(`
      INSERT INTO companies (id, name, slug, active, max_users, subscription_status)
      VALUES (1, 'System Company', 'system', TRUE, 100, 'active')
      ON CONFLICT (id) DO UPDATE SET active = TRUE;
    `);

        // 4. Force Reset User bar@eto.com
        console.log('👤 Resetting bar@eto.com...');
        await client.query(`
      INSERT INTO users (
        email, username, password, full_name, role, is_super_admin, company_id, active, mobile_phone, notification_preferences, permissions
      ) VALUES (
        'bar@eto.com',
        'bar@eto.com',
        'PLAIN:as12345',
        'Bar User',
        'admin',
        TRUE,
        1,
        TRUE,
        NULL,
        '{"whatsapp": false, "email": true}',
        '{}'
      )
      ON CONFLICT (username) DO UPDATE SET -- Assuming username constraint
        password = 'PLAIN:as12345',
        active = TRUE,
        company_id = 1,
        role = 'admin';
    `);

        // Also update by email just in case constraint is on email
        await client.query(`UPDATE users SET password = 'PLAIN:as12345', active = TRUE, company_id = 1 WHERE email = 'bar@eto.com';`);

        console.log('✅ FIX COMPLETE.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

fixAggressive();
