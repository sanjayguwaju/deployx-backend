import { BirthRegistration, DeathRegistration } from '../../models/Registration';
import { Office } from '../../models/Office';
import { ITenant } from '../../models/Tenant';
import { Candidate } from '../../models/Candidate';
import { faker } from '@faker-js/faker';
import { randomArrayItem } from './utils';

export async function seedRegistrations(tenant: ITenant) {
  console.log('📝 Seeding Registrations (Births & Deaths)...');

  const existingBirths = await BirthRegistration.countDocuments({ tenantId: tenant._id });
  if (existingBirths > 0) {
    console.log(`⏩ Registrations already exist for ${tenant.name}. Skipping.`);
    return;
  }

  const offices = await Office.find({ tenantId: tenant._id });
  const candidates = await Candidate.find({ tenantId: tenant._id }).limit(20);

  if (offices.length === 0 || candidates.length === 0) {
    throw new Error('Offices or Candidates not found. Run previous seeders first.');
  }

  const NUM_REGISTRATIONS = 20;
  
  // 1. Births
  const births = [];
  for (let i = 0; i < NUM_REGISTRATIONS; i++) {
    const office = randomArrayItem(offices);
    const father = randomArrayItem(candidates);
    const mother = randomArrayItem(candidates);

    births.push({
      tenantId: tenant._id,
      officeId: office._id,
      registrationNumber: `B-${faker.string.alphanumeric(6).toUpperCase()}`,
      registrationDateBs: '2080-01-01',
      registrationDateAd: new Date(),
      status: randomArrayItem(['pending', 'verified', 'certificate_issued']),
      childName: faker.person.firstName(),
      childNameNp: 'बच्चा',
      dateOfBirthBs: '2080-01-01',
      dateOfBirthAd: faker.date.recent(),
      gender: randomArrayItem(['male', 'female']),
      fatherName: `${father.firstName} ${father.lastName}`,
      fatherCandidateshipNo: father.passportNumber,
      motherName: `${mother.firstName} ${mother.lastName}`,
      motherCandidateshipNo: mother.passportNumber,
      fatherId: father._id,
      motherId: mother._id,
    });
  }
  await BirthRegistration.insertMany(births);

  // 2. Deaths
  const deaths = [];
  for (let i = 0; i < 10; i++) {
    const office = randomArrayItem(offices);
    const deceased = randomArrayItem(candidates);
    const informant = randomArrayItem(candidates);

    deaths.push({
      tenantId: tenant._id,
      officeId: office._id,
      registrationNumber: `D-${faker.string.alphanumeric(6).toUpperCase()}`,
      registrationDateBs: '2080-02-01',
      status: randomArrayItem(['pending', 'verified', 'certificate_issued']),
      deceasedName: `${deceased.firstName} ${deceased.lastName}`,
      dateOfDeathBs: '2080-01-15',
      dateOfDeathAd: faker.date.recent(),
      gender: deceased.gender,
      ageAtDeath: String(faker.number.int({ min: 1, max: 90 })),
      causeOfDeath: 'Natural',
      informantName: `${informant.firstName} ${informant.lastName}`,
      informantRelation: 'Son/Daughter',
      candidateId: deceased._id,
    });
  }
  await DeathRegistration.insertMany(deaths);

  console.log(`✅ ${NUM_REGISTRATIONS} Births and 10 Deaths seeded successfully.`);
}
