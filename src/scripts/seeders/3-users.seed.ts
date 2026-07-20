import { User } from '../../models/User';
import { Role } from '../../models/Role';
import { Office } from '../../models/Office';
import { ITenant } from '../../models/Tenant';
import { SystemRole } from '../../types';
import { generateNepaliPhone } from './utils';

export async function seedUsers(tenant: ITenant) {
  console.log('👤 Seeding Users...');

  const superAdminRole = await Role.findOne({ tenantId: tenant._id, slug: 'superadmin' });
  const wardOfficerRole = await Role.findOne({ tenantId: tenant._id, slug: 'ward_officer' });
  
  if (!superAdminRole || !wardOfficerRole) {
    throw new Error('Roles not found. Run roles seeder first.');
  }

  // 1. Super Admin
  const adminEmail = 'admin@demo.gov.np';
  let admin = await User.findOne({ email: adminEmail });
  
  if (!admin) {
    await User.create({
      tenantId: tenant._id,
      name: 'System Administrator',
      nameNp: 'प्रणाली प्रशासक',
      email: adminEmail,
      password: 'Password123!',
      phone: generateNepaliPhone(),
      roles: [superAdminRole._id],
      rolesSlugs: ['superadmin'],
      isActive: true,
      designation: 'IT Officer'
    });
  }

  // 2. Office Officers
  const offices = await Office.find({ tenantId: tenant._id });
  
  for (const office of offices) {
    const wardEmail = `office${office.officeNumber}@demo.gov.np`;
    const existing = await User.findOne({ email: wardEmail });
    
    if (!existing) {
      await User.create({
        tenantId: tenant._id,
        officeId: office._id,
        name: `Office ${office.officeNumber} Officer`,
        nameNp: `वडा ${office.officeNumber} अधिकृत`,
        email: wardEmail,
        password: 'Password123!',
        phone: generateNepaliPhone(),
        roles: [wardOfficerRole._id],
        rolesSlugs: ['ward_officer'],
        isActive: true,
        designation: 'Office Secretary'
      });
    }
  }

  console.log('✅ Users seeded successfully.');
}
