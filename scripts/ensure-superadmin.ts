import 'dotenv/config';

async function ensureSuperAdmin() {
    // 1. Arreglamos el entorno ANTES de cargar nada más
    if (process.env.DATABASE_URL) {
        // Forzamos el puerto 5432
        process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/:543[0-9]/, ':5432');

        // ELIMINAMOS cualquier parámetro sslmode que venga en la URL
        process.env.DATABASE_URL = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]+/, '');

        // AÑADIMOS la señal para que postgres no intente SSL
        process.env.PGSSLMODE = 'disable';

        console.log('Entorno corregido: Puerto 5432, SSL desactivado.');
    }
    process.env.NODE_ENV = 'production';

    // 2. AHORA cargamos la base de datos
    const { storage } = await import('../server/storage');

    const email = 'admin@ianampudia.com';
    console.log(`Checking privileges for ${email}...`);

    try {
        const user = await storage.getUserByEmail(email);

        if (!user) {
            console.error(`User with email ${email} not found!`);
            process.exit(1);
        }

        console.log(`Found user ID: ${user.id}`);

        // Update permissions to Super Admin without changing password
        await storage.updateUser(user.id, {
            isSuperAdmin: true,
            role: 'super_admin'
        });

        console.log('SUCCESS: User promoted to Super Admin.');
        process.exit(0);
    } catch (error) {
        console.error('Error promoting user:', error);
        process.exit(1);
    }
}

ensureSuperAdmin();
