import { Complaint } from '../../models/Complaint';
import { Office } from '../../models/Office';
import { ITenant } from '../../models/Tenant';
import { faker } from '@faker-js/faker';
import { randomArrayItem } from './utils';

export async function seedComplaints(tenant: ITenant) {
  console.log('🗣️  Seeding Complaints...');

  const existingCount = await Complaint.countDocuments({ tenantId: tenant._id });
  if (existingCount > 0) {
    console.log(`⏩ Complaints already exist for ${tenant.name}. Skipping.`);
    return;
  }

  const offices = await Office.find({ tenantId: tenant._id });
  
  const TOTAL_COMPLAINTS = 25;
  const complaints = [];
  let trackingNumber = 1000;

  for (let i = 0; i < TOTAL_COMPLAINTS; i++) {
    const isAnonymous = Math.random() > 0.7;
    const office = randomArrayItem(offices);
    
    complaints.push({
      tenantId: tenant._id,
      officeId: office._id,
      trackingNumber: `CMP-${new Date().getFullYear()}-${trackingNumber++}`,
      category: randomArrayItem(['Infrastructure', 'Public Service', 'Sanitation', 'Corruption', 'Other']),
      subject: faker.lorem.sentence(4),
      description: faker.lorem.paragraph(),
      isAnonymous,
      complainantName: isAnonymous ? undefined : faker.person.fullName(),
      complainantPhone: isAnonymous ? undefined : faker.string.numeric(10),
      status: randomArrayItem(['received', 'under_investigation', 'resolved', 'closed']),
      priority: randomArrayItem(['low', 'normal', 'high', 'urgent']),
      isDeleted: false
    });
  }

  await Complaint.insertMany(complaints);
  console.log(`✅ ${TOTAL_COMPLAINTS} Complaints seeded successfully.`);
}
