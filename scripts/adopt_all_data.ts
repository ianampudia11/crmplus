
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function adoptAllData() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected.');

        const targetCompanyId = 1;
        console.log(`🏗️ Adopting ALL data to Company ID ${targetCompanyId}...`);

        // Properties
        const resProp = await client.query(`UPDATE properties SET company_id = $1 WHERE company_id != $1 OR company_id IS NULL`, [targetCompanyId]);
        console.log(`✅ Updated ${resProp.rowCount} properties.`);

        // Deals
        const resDeals = await client.query(`UPDATE deals SET company_id = $1 WHERE company_id != $1 OR company_id IS NULL`, [targetCompanyId]);
        console.log(`✅ Updated ${resDeals.rowCount} deals.`);

        // Pipelines
        const resPipes = await client.query(`UPDATE pipelines SET company_id = $1 WHERE company_id != $1 OR company_id IS NULL`, [targetCompanyId]);
        console.log(`✅ Updated ${resPipes.rowCount} pipelines.`);

        // Contacts
        const resContacts = await client.query(`UPDATE contacts SET company_id = $1 WHERE company_id != $1 OR company_id IS NULL`, [targetCompanyId]);
        console.log(`✅ Updated ${resContacts.rowCount} contacts.`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

adoptAllData();
