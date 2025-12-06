
import { pool } from '../server/db';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
}

async function fixAdmin() {
    const email = process.argv[2] || 'admin@ianampudia.com';
    const password = process.argv[3] || 'Segura123';

    console.log(`🔧 Attempting to fix admin access for: ${email}`);

    try {
        const hashedPassword = await hashPassword(password);

        // Check if user exists
        const checkRes = await pool.query('SELECT id FROM users WHERE email = $1', [email]);

        if (checkRes.rows.length > 0) {
            console.log('👤 User exists. Updating password and permissions...');
            await pool.query(`
        UPDATE users 
        SET password = $1, is_super_admin = true, role = 'admin'
        WHERE email = $2
      `, [hashedPassword, email]);
            console.log('✅ Updated existing user.');
        } else {
            console.log('wm Creating new Super Admin user...');
            // We need a company first? Usually yes. Let's see if we can find one or create a dummy.
            // For now, let's assume they might not have a company if it's a fresh broken install.
            // But usually 'migrations' create a company 'Iawarrior Tech'.

            const companyRes = await pool.query("SELECT id FROM companies LIMIT 1");
            let companyId;

            if (companyRes.rows.length > 0) {
                companyId = companyRes.rows[0].id;
            } else {
                console.log('🏢 No company found. Creating default company...');
                const newComp = await pool.query(`
          INSERT INTO companies (name, slug, active)
          VALUES ('System Admin', 'system-admin', true)
          RETURNING id
        `);
                companyId = newComp.rows[0].id;
            }

            await pool.query(`
        INSERT INTO users (username, email, password, full_name, role, company_id, is_super_admin)
        VALUES ($1, $2, $3, 'Super Admin', 'admin', $4, true)
      `, [email, email, hashedPassword, companyId]);
            console.log('✅ Created new Super Admin user.');
        }

        console.log('\n🎉 SUCCESS! You should now be able to login.');
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fixing admin:', error);
        process.exit(1);
    }
}

fixAdmin();
