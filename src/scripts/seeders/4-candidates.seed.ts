import { Candidate } from '../../models/Candidate';
import { Office } from '../../models/Office';
import { ITenant } from '../../models/Tenant';
import { faker } from '@faker-js/faker';
import { generateNepaliPhone, randomArrayItem } from './utils';

export async function seedCandidates(tenant: ITenant) {
  console.log('🧑‍🤝‍🧑 Seeding Candidates...');

  const existingCount = await Candidate.countDocuments({ tenantId: tenant._id });
  
  if (existingCount > 0) {
    console.log(`⏩ Candidates already exist for ${tenant.name}. Skipping.`);
    return;
  }

  const offices = await Office.find({ tenantId: tenant._id });
  if (offices.length === 0) throw new Error('Offices not found. Run tenant seeder first.');

  const citizensToCreate = [];
  const TOTAL_CITIZENS = 50;

  for (let i = 0; i < TOTAL_CITIZENS; i++) {
    const gender = randomArrayItem(['male', 'female', 'other']);
    const fakerGender = gender === 'other' ? undefined : (gender as 'male' | 'female');
    const firstName = faker.person.firstName(fakerGender);
    const lastName = faker.person.lastName();
    const office = randomArrayItem(offices);

    citizensToCreate.push({
      tenantId: tenant._id,
      officeId: office._id,
      firstName,
      lastName,
      firstNameNp: firstName, // In a real app, this would be transliterated
      lastNameNp: lastName,
      gender,
      dateOfBirthAd: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }),
      passportNumber: `${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 10, max: 99 })}-${faker.number.int({ min: 10000, max: 99999 })}`,
      citizenshipIssuedDistrict: 'Kathmandu',
      nationalIdNumber: faker.string.numeric(10),
      phone: generateNepaliPhone(),
      email: faker.internet.email({ firstName, lastName }),
      permanentAddress: `${office.officeAddress}, ${tenant.district}`,
      occupation: randomArrayItem(['Agriculture', 'Business', 'Student', 'Government Service', 'Foreign Employment']),
      isVerified: Math.random() > 0.2, // 80% verified
      status: randomArrayItem(['pending', 'approved', 'approved', 'approved', 'rejected']),
      isDeleted: false
    });
  }

  await Candidate.insertMany(citizensToCreate);
  console.log(`✅ ${TOTAL_CITIZENS} Candidates seeded successfully.`);
}
