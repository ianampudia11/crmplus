
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function diagnoseData() {
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await client.connect();
        console.log('🔌 Connected to DB.');

        // Check Current User stats
        const userRes = await client.query(`SELECT id, username, email, company_id FROM users WHERE email = 'bar@eto.com'`);
        console.log('\n👤 Current User (bar@eto.com):');
        console.table(userRes.rows);
        const myCompanyId = userRes.rows[0]?.company_id;

        // Check Properties
        console.log('\n🏠 Properties Table Stats:');
        const propCount = await client.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE company_id = $1) as my_company FROM properties`, [myCompanyId]);
        console.table(propCount.rows);

        const propSample = await client.query(`SELECT id, name, company_id FROM properties LIMIT 5`);
        if (propSample.rows.length > 0) {
            console.log('Sample Properties:');
            console.table(propSample.rows);
        }

        // Check Pipelines/Deals ("Rutas de Lead")
        console.log('\n💰 Deals/Pipelines Stats:');
        try {
            const dealCount = await client.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE company_id = $1) as my_company FROM deals`, [myCompanyId]);
            console.table(dealCount.rows);
        } catch (e) { console.log('Deals table error:', e.message); }

        try {
            const pipeCount = await client.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE company_id = $1) as my_company FROM pipelines`, [myCompanyId]);
            console.table(pipeCount.rows);
        } catch (e) { console.log('Pipelines table error:', e.message); }


    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

diagnoseData();
