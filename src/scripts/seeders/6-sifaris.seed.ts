import { AppDocument } from '../../models/Document';
import { User } from '../../models/User';
import { ITenant } from '../../models/Tenant';
import { faker } from '@faker-js/faker';
import { randomArrayItem } from './utils';

export async function seedSifaris(tenant: ITenant) {
  console.log('📜 Seeding Sifaris (Documents)...');

  const existingCount = await AppDocument.countDocuments({ tenantId: tenant._id });
  if (existingCount > 0) {
    console.log(`⏩ Sifaris documents already exist for ${tenant.name}. Skipping.`);
    return;
  }

  const wardOfficers = await User.find({ tenantId: tenant._id, email: /office/ });
  
  if (wardOfficers.length === 0) {
    throw new Error('Office Officers not found. Run users seeder first.');
  }

  const documentsToCreate = [];
  const TOTAL_DOCUMENTS = 30;

  for (let i = 0; i < TOTAL_DOCUMENTS; i++) {
    const officer = randomArrayItem(wardOfficers);
    
    documentsToCreate.push({
      documentType: 'sifaris',
      templateName: 'default',
      data: {
        applicantName: faker.person.fullName(),
        content: 'This is a mock sifaris document generated for testing purposes.',
        date: new Date().toLocaleDateString()
      },
      issuedBy: officer._id,
      tenantId: tenant._id,
      verificationHash: faker.string.uuid(),
      issueDate: faker.date.recent(),
      status: randomArrayItem(['valid', 'valid', 'valid', 'revoked'])
    });
  }

  await AppDocument.insertMany(documentsToCreate);
  console.log(`✅ ${TOTAL_DOCUMENTS} Sifaris documents seeded successfully.`);
}
