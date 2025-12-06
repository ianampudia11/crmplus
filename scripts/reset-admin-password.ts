import { storage } from '../server/storage';
import { hashPassword } from '../server/auth';
import { db } from '../server/db';

async function resetAdminPassword() {
    const email = process.argv[2] || 'admin@ianampudia.com';
    const newPassword = process.argv[3] || 'admin123';

    console.log(`Resetting password for ${email}...`);
    console.log("Running Reset Script v2 (Smart Update)...");

    try {
        let user = await storage.getUserByEmail(email);
        const hashedPassword = await hashPassword(newPassword);

        // If not found by email, try to find by username 'admin' to avoid duplicates
        if (!user) {
            console.log(`User with email ${email} not found. Checking for 'admin' username...`);
            user = await storage.getUserByUsername('admin');

            if (user) {
                console.log(`Found existing user with username 'admin' (ID: ${user.id}). Updating email and password...`);
                // Update email along with password
                await storage.updateUser(user.id, {
                    email: email,
                    password: hashedPassword,
                    isSuperAdmin: true,
                    role: 'super_admin'
                });
                console.log('User updated successfully!');
                console.log('Super Admin status confirmed.');
                process.exit(0);
            }
        }

        if (!user) {
            console.log(`User not found. Creating new admin user...`);
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
