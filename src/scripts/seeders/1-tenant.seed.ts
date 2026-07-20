import { Tenant } from '../../models/Tenant';
import { Office } from '../../models/Office';
import { DEMO_TENANT_ID, generateNepaliPhone } from './utils';

export async function seedMunicipalities() {
  console.log('🏢 Seeding Municipalities & Offices...');

  // 1. Create the Default Demo Tenant
  let tenant = await Tenant.findOne({ subdomain: DEMO_TENANT_ID });
  
  if (!tenant) {
    tenant = await Tenant.create({
      name: 'Demo Tenant',
      nameNp: 'डेमो नगरपालिका',
      code: 'DEMO-01',
      subdomain: DEMO_TENANT_ID,
      district: 'Kathmandu',
      province: 'Bagmati',
      type: 'urban',
      totalOffices: 5,
      contactEmail: 'info@demo.gov.np',
      contactPhone: generateNepaliPhone(),
      address: 'Kathmandu, Nepal',
      status: 'approved',
      isActive: true
    });
  }

  // 2. Create Offices for this Tenant
  const existingOffices = await Office.countDocuments({ tenantId: tenant._id });
  
  if (existingOffices === 0) {
    const wardsToCreate = [];
    for (let i = 1; i <= tenant.totalOffices; i++) {
      wardsToCreate.push({
        tenantId: tenant._id,
        officeNumber: i,
        nameNp: `वडा नं ${i}`,
        officeAddress: `Office ${i} Office, Demo`,
        contactPhone: generateNepaliPhone(),
        population: Math.floor(Math.random() * (5000 - 1000 + 1) + 1000), // 1000 to 5000
        isActive: true
      });
    }
    await Office.insertMany(wardsToCreate);
    console.log(`✅ Created ${tenant.totalOffices} offices for ${tenant.name}.`);
  } else {
    console.log(`⏩ Offices already exist for ${tenant.name}. Skipping.`);
  }

  return tenant;
}
