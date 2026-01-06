
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function hashPassword(password: string) {
    const salt = crypto.randomBytes(16).toString('hex');
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString('hex')}.${salt}`;
}

async function resetSuperAdmin() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        const newPass = await hashPassword('admin123'); // Default password

        // 1. Reset admin@admin.com
        console.log('🔑 Resetting admin@admin.com...');
        const res1 = await client.query(`
        UPDATE users 
        SET password = $1, is_super_admin = TRUE, role = 'admin'
        WHERE email = 'admin@admin.com'
    `, [newPass]);

        if (res1.rowCount > 0) {
            console.log('✅ admin@admin.com password set to: admin123');
        } else {
            console.log('⚠️ admin@admin.com not found. Creating it...');
            await client.query(`
            INSERT INTO users (username, email, password, role, is_super_admin, company_id, created_at)
            VALUES ('superadmin', 'admin@admin.com', $1, 'admin', TRUE, 1, NOW())
        `, [newPass]);
            console.log('✅ Created admin@admin.com / admin123');
        }

        // 2. Fix bar@eto.com super admin status
        console.log('🔧 Ensuring bar@eto.com is Super Admin...');
        await client.query(`UPDATE users SET is_super_admin = TRUE WHERE email = 'bar@eto.com'`);
        console.log('✅ bar@eto.com granted Super Admin privileges.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

resetSuperAdmin();
