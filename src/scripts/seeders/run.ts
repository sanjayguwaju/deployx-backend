import { initSeeder, closeSeeder } from './utils';
import { seedMunicipalities } from './1-tenant.seed';
import { seedRoles } from './2-roles.seed';
import { seedUsers } from './3-users.seed';
import { seedCandidates } from './4-candidates.seed';
import { seedRegistrations } from './5-registrations.seed';
import { seedSifaris } from './6-sifaris.seed';
import { seedRevenue } from './7-revenue.seed';
import { seedInfra } from './8-infra.seed';
import { seedComplaints } from './9-complaints.seed';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function runSeeders() {
  const clearDB = process.argv.includes('--clear');
  
  try {
    await initSeeder(clearDB);

    // 1. Foundation
    const tenant = await seedMunicipalities();
    await seedRoles(tenant);
    await seedUsers(tenant);

    // 2. Core Modules
    await seedCandidates(tenant);
    await seedRegistrations(tenant);
    await seedSifaris(tenant);

    // 3. Advanced Modules
    await seedRevenue(tenant);
    await seedInfra(tenant);
    await seedComplaints(tenant);

    console.log('🎉 All seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await closeSeeder();
  }
}

runSeeders();
