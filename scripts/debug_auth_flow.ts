
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function debugAuth() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('Connected to DB');

        // 1. Simulate getUserByUsernameOrEmail
        console.log('Searching for bar@eto.com...');
        // We are using raw SQL here, matching what Drizzle likely does but simpler
        const res = await client.query(`SELECT * FROM users WHERE email = $1 OR username = $1`, ['bar@eto.com']);

        if (res.rows.length === 0) {
            console.log('❌ User NOT FOUND in DB');
            return;
        }

        const user = res.rows[0];
        console.log('✅ User Found:', { id: user.id, email: user.email, password: user.password });

        // 2. Simulate comparePasswords
        const supplied = 'as12345';
        const stored = user.password;

        console.log(`Checking password... Supplied: "${supplied}", Stored: "${stored}"`);

        if (stored.startsWith('PLAIN:')) {
            const plainStored = stored.substring(6);
            console.log(`PLAIN Check: "${supplied}" === "${plainStored}" -> ${supplied === plainStored}`);
        } else {
            console.log('Hashing Check...');
            const [hashed, salt] = stored.split(".");
            if (!salt) {
                console.error('❌ Error: Salt undefined. Password format invalid.');
            } else {
                const hashedBuf = Buffer.from(hashed, "hex");
                const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
                console.log('Hash Match:', timingSafeEqual(hashedBuf, suppliedBuf));
            }
        }

    } catch (err) {
        console.error('❌ CRASHED:', err);
    } finally {
        await client.end();
    }
}

debugAuth();
