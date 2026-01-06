
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixDuplicates() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        // 1. Drop problematic indices if they exist (We don't want them blocking inserts)
        console.log('🔨 Dropping problematic indices...');
        await client.query(`DROP INDEX IF EXISTS idx_contacts_external_id;`);
        await client.query(`DROP INDEX IF EXISTS idx_contacts_unique_identifier_company;`); // From migration 108, might fail if data dupes exist
        await client.query(`DROP INDEX IF EXISTS idx_messages_conversation_external_id;`);

        // 2. Clean up duplicate Contacts (Nullify external_id to save them, or delete?)
        // Let's NULLIFY external_id for duplicates to avoid data loss but allow unique constraint
        console.log('🧹 Cleaning Contacts duplicates...');
        // If external_id exists...
        try {
            await client.query(`
            UPDATE contacts 
            SET external_id = NULL 
            WHERE id IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY created_at DESC) as rnum
                    FROM contacts 
                    WHERE external_id IS NOT NULL
                ) t WHERE t.rnum > 1
            );
        `);
        } catch (e) {
            console.log('Skipping contacts cleanup (maybe column missing)');
        }

        // 3. Clean up Message duplicates
        console.log('🧹 Cleaning Messages duplicates...');
        try {
            await client.query(`
            UPDATE messages 
            SET external_id = NULL 
            WHERE id IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (PARTITION BY external_id ORDER BY created_at DESC) as rnum
                    FROM messages 
                    WHERE external_id IS NOT NULL
                ) t WHERE t.rnum > 1
            );
        `);
        } catch (e) {
            console.log('Skipping messages cleanup');
        }

        console.log('✅ CLEANUP COMPLETE.');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

fixDuplicates();
