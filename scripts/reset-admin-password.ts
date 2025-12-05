import { storage } from '../server/storage';
import { hashPassword } from '../server/auth';
import { db } from '../server/db';

async function resetAdminPassword() {
    const email = 'admin@ianampudia.com';
    const newPassword = 'admin123';

    console.log(`Resetting password for ${email}...`);

    try {
        let user = await storage.getUserByEmail(email);
        const hashedPassword = await hashPassword(newPassword);

        if (!user) {
            console.log(`User with email ${email} not found. Creating new admin user...`);
            user = await storage.createUser({
                username: 'admin',
                email: email,
                password: hashedPassword,
                fullName: 'System Administrator',
                role: 'super_admin',
                isSuperAdmin: true,
                active: true,
                companyId: null, // Super admin might not need a company
                avatarUrl: null,
                languagePreference: 'es',
                permissions: {}
            });
            console.log(`Created new admin user with ID: ${user.id}`);
        } else {
            console.log(`Found user ID: ${user.id}`);
            // Update password and ensure super admin status
            await storage.updateUser(user.id, {
                password: hashedPassword,
                isSuperAdmin: true,
                role: 'super_admin'
            });
            console.log('User updated successfully!');
        }

        console.log('Super Admin status confirmed.');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting/creating admin:', error);
        process.exit(1);
    }
}

resetAdminPassword();
