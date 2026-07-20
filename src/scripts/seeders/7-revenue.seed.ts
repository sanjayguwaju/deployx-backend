import { RevenueCollection } from '../../models/RevenueCollection';
import { TaxRule } from '../../models/TaxRule';
import { Office } from '../../models/Office';
import { User } from '../../models/User';
import { ITenant } from '../../models/Tenant';
import { faker } from '@faker-js/faker';
import { randomArrayItem } from './utils';

export async function seedRevenue(tenant: ITenant) {
  console.log('💰 Seeding Revenue & Tax Rules...');

  const existingCount = await RevenueCollection.countDocuments({ tenantId: tenant._id });
  if (existingCount > 0) {
    console.log(`⏩ Revenue records already exist for ${tenant.name}. Skipping.`);
    return;
  }

  const offices = await Office.find({ tenantId: tenant._id });
  const users = await User.find({ tenantId: tenant._id });
  
  if (offices.length === 0 || users.length === 0) {
    throw new Error('Offices or Users not found. Run previous seeders first.');
  }

  // 1. Tax Rules
  const taxRules = [
    {
      tenantId: tenant._id,
      name: 'Residential Property Tax',
      taxType: 'property',
      baseRate: 500,
      multiplier: 1,
      fiscalYear: '2080/81',
      isActive: true
    },
    {
      tenantId: tenant._id,
      name: 'Commercial Property Tax',
      taxType: 'property',
      baseRate: 500,
      multiplier: 2.5,
      fiscalYear: '2080/81',
      isActive: true
    },
    {
      tenantId: tenant._id,
      name: 'Retail Business Registration',
      taxType: 'business',
      baseRate: 2000,
      multiplier: 1,
      fiscalYear: '2080/81',
      isActive: true
    }
  ];
  await TaxRule.insertMany(taxRules);

  // 2. Revenue Collection Records
  const revenues = [];
  const TOTAL_RECORDS = 50;
  let receiptCounter = 1000;

  for (let i = 0; i < TOTAL_RECORDS; i++) {
    const office = randomArrayItem(offices);
    const collector = randomArrayItem(users);
    
    revenues.push({
      tenantId: tenant._id,
      officeId: office._id,
      revenueType: randomArrayItem(['property_tax', 'business_registration', 'rental_fee', 'service_fee', 'other']),
      payerName: faker.person.fullName(),
      payerPhone: faker.string.numeric(10),
      amountNpr: faker.number.int({ min: 100, max: 15000 }),
      receiptNumber: `REC-2080-${receiptCounter++}`,
      dateBs: `2080-${faker.number.int({ min: 1, max: 12 }).toString().padStart(2, '0')}-${faker.number.int({ min: 1, max: 28 }).toString().padStart(2, '0')}`,
      collectedBy: collector._id
    });
  }

  await RevenueCollection.insertMany(revenues);
  console.log(`✅ ${TOTAL_RECORDS} Revenue records seeded successfully.`);
}
