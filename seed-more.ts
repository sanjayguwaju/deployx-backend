import { Municipality } from './src/models/Municipality';
import { FeatureFlag } from './src/models/FeatureFlag';
import { initSeeder, closeSeeder } from './src/scripts/seeders/utils';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function run() {
  await initSeeder(false);

  console.log('Seeding 20 Municipalities...');
  for (let i = 1; i <= 20; i++) {
    const code = `TEST${i.toString().padStart(3, '0')}`;
    const subdomain = `testmun${i}`;
    const name = `Test Municipality ${i}`;

    const existing = await Municipality.findOne({ code });
    if (!existing) {
      await Municipality.create({
        name,
        code,
        subdomain,
        type: 'rural',
        totalWards: 5,
        isActive: true,
        status: 'approved'
      });
    }
  }

  console.log('Seeding 20 System Feature Flags...');
  for (let i = 1; i <= 20; i++) {
    const key = `feature_flag_${i}`;
    const name = `Feature Flag ${i}`;

    const existing = await FeatureFlag.findOne({ key, municipalityId: null });
    if (!existing) {
      await FeatureFlag.create({
        key,
        name,
        description: `This is a test feature flag number ${i}`,
        isActive: false, // system definitions are usually false or disabled by default across tenants
        isSystemFlag: true,
      });
    }
  }

  console.log('Done!');
  await closeSeeder();
}

run();
