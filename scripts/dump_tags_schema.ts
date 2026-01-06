
import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function dumpSchema() {
    try {
        const desiredTables = ['tags', 'contact_tags', 'contact_tasks', 'task_categories'];
        let output = '';

        for (const tableName of desiredTables) {
            output += `\n=== TABLE: ${tableName} ===\n`;

            const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        );
      `);

            if (!tableExists.rows[0].exists) {
                output += `[MISSING]\n`;
                continue;
            }

            const columns = await db.execute(sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = ${tableName}
        ORDER BY ordinal_position;
      `);

            columns.rows.forEach((col: any) => {
                output += `  COL: ${col.column_name} ${col.data_type} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} DEFAULT ${col.column_default}\n`;
            });

            const constraints = await db.execute(sql`
        SELECT tc.constraint_name, tc.constraint_type, kcu.column_name, 
               ccu.table_name AS foreign_table_name,
               ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.table_name = ${tableName};
      `);

            constraints.rows.forEach((con: any) => {
                output += `  CON: ${con.constraint_name} ${con.constraint_type} (${con.column_name}) -> ${con.foreign_table_name}(${con.foreign_column_name})\n`;
            });
        }

        fs.writeFileSync('schema_dump.txt', output);
        console.log("Dump written to schema_dump.txt");

    } catch (error) {
        console.error("Error:", error);
    }
    process.exit(0);
}

dumpSchema();
