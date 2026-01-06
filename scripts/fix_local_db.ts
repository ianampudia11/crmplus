
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixLocalDb() {
    console.log('🔌 Connecting to local database...');
    console.log('URL:', process.env.DATABASE_URL);

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });

    try {
        await client.connect();
        console.log('✅ Connected.');

        console.log('🛠️ Applying Schema Fixes (mobile_phone)...');

        // 1. Add missing columns
        await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS mobile_phone TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"whatsapp": false, "email": true}';
    `);
        console.log('✅ Schema Updated.');

        // 2. Ensure Admin User exists and is valid
        console.log('👤 Ensuring Admin User...');

        // Create System Company if missing
        await client.query(`
      INSERT INTO companies (id, name, slug, active, max_users, subscription_status)
      VALUES (1, 'System Company', 'system', TRUE, 100, 'active')
      ON CONFLICT (id) DO NOTHING;
    `);

        // Create/Update Admin
        // Using PLAIN password for local dev ease, or simple hash if we had one. 
        // We will use PLAIN:admin123 to be consistent with our production fix which is now supported by the code.
        await client.query(`
      INSERT INTO users (
        id, email, username, password, full_name, role, is_super_admin, company_id, created_at, active
      ) VALUES (
        1,
        'admin@local.dev',
        'admin@local.dev',
        'PLAIN:admin123',
        'Local Admin',
        'admin',
        TRUE,
        1,
        NOW(),
        TRUE
      )
      ON CONFLICT (id) DO UPDATE SET
        password = 'PLAIN:admin123',
        is_super_admin = TRUE,
        active = TRUE;
    `);

        console.log('✅ Admin User Ready:');
        console.log('   Email: admin@local.dev');
        console.log('   Pass:  admin123');

    } catch (err) {
        console.error('❌ Error fixing database:', err);
    } finally {
        await client.end();
    }
}

fixLocalDb();
