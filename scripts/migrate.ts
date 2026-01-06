
// Load environment variables FIRST before any imports
import { config } from 'dotenv';
config();

import { pool } from '../server/db';
import { MigrationSystem } from '../server/migration-system';

async function runMigrations() {
    console.log('Starting migrations...');

    try {
        // Use PostgreSQL pool for migrations
        console.log('Using PostgreSQL pool for migrations');

        // Initialize migration system
        const migrationSystem = new MigrationSystem(pool);

        // Run pending migrations
        await migrationSystem.runPendingMigrations();

        console.log('Migrations completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigrations();
