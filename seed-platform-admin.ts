import { User } from './src/models/User';
import { Role } from './src/models/Role';
import { initSeeder, closeSeeder } from './src/scripts/seeders/utils';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function run() {
  await initSeeder(false);

  // Create platform_admin role
  let role = await Role.findOne({ slug: 'platform_admin' });
  if (!role) {
    role = await Role.create({
      name: 'Platform Super Admin',
      slug: 'platform_admin',
      description: 'System-wide platform admin',
      isSystem: true,
      level: 0,
      permissions: [{ module: 'all', action: 'manage' }]
    });
    console.log('Platform admin role created.');
  }

  const Municipality = require('./src/models/Municipality').Municipality;
  const municipality = await Municipality.findOne();
  
  if (!municipality) {
    console.error('No municipality found, run standard seeders first.');
    return;
  }

  // Create user
  let user = await User.findOne({ email: 'superadmin@platform.gov.np' });
  if (!user) {
    await User.create({
      name: 'Platform Administrator',
      email: 'superadmin@platform.gov.np',
      password: 'Super@1234',
      phone: '9800000000',
      municipalityId: municipality._id,
      roles: [role._id],
      rolesSlugs: ['platform_admin'],
      isActive: true,
      designation: 'Platform Admin'
    });
    console.log('Platform admin user created: superadmin@platform.gov.np / Super@1234');
  } else {
    console.log('User already exists');
  }

  await closeSeeder();
}

run();
