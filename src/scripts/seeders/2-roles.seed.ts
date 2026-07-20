import { Role } from '../../models/Role';
import { ITenant } from '../../models/Tenant';
import { SystemRole } from '../../types';

export async function seedRoles(tenant: ITenant) {
  console.log('🔐 Seeding Roles...');

  const roles = [
    {
      tenantId: tenant._id,
      name: 'Super Admin',
      nameNp: 'सुपर एडमिन',
      slug: 'superadmin',
      description: 'Full access to tenant settings and data',
      isSystem: true,
      level: 1,
      permissions: [{ module: 'all', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Mayor',
      nameNp: 'नगर प्रमुख',
      slug: 'mayor',
      description: 'The head of the local government and chief of the Municipal Executive',
      isSystem: true,
      level: 1,
      permissions: [{ module: 'all', action: 'read' }, { module: 'approvals', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Deputy Mayor',
      nameNp: 'उपप्रमुख',
      slug: 'deputy_mayor',
      description: 'Second-in-command, acts as the Mayor in their absence, and serves as the Coordinator of the Judicial Committee',
      isSystem: true,
      level: 1,
      permissions: [{ module: 'all', action: 'read' }, { module: 'complaints', action: 'manage' }, { module: 'approvals', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Chief Administrative Officer (CAO)',
      nameNp: 'प्रमुख प्रशासकीय अधिकृत',
      slug: 'cao',
      description: 'The supreme administrative head of the tenant. All municipal staff and divisions report to the CAO.',
      isSystem: true,
      level: 2,
      permissions: [{ module: 'all', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Office Chairperson',
      nameNp: 'वडा अध्यक्ष',
      slug: 'ward_chairperson',
      description: 'The political head of their respective office',
      isSystem: true,
      level: 3,
      permissions: [{ module: 'candidates', action: 'read' }, { module: 'sifaris', action: 'manage' }, { module: 'registrations', action: 'read' }, { module: 'approvals', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Office Member',
      nameNp: 'वडा सदस्य',
      slug: 'ward_member',
      description: 'Grassroots elected representatives',
      isSystem: true,
      level: 3,
      permissions: [{ module: 'candidates', action: 'read' }]
    },
    {
      tenantId: tenant._id,
      name: 'Office Secretary',
      nameNp: 'वडा सचिव',
      slug: 'ward_secretary',
      description: 'The highest-ranking civil servant stationed in the office',
      isSystem: true,
      level: 3,
      permissions: [
        { module: 'candidates', action: 'manage' },
        { module: 'sifaris', action: 'manage' },
        { module: 'registrations', action: 'manage' },
        { module: 'revenue', action: 'manage' }
      ]
    },
    {
      tenantId: tenant._id,
      name: 'Administrative Officer',
      slug: 'admin_officer',
      description: 'Head of General Administration',
      isSystem: false,
      level: 2,
      permissions: [{ module: 'all', action: 'read' }, { module: 'users', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Senior Engineer',
      slug: 'senior_engineer',
      description: 'Head of Infrastructure/Engineering',
      isSystem: false,
      level: 2,
      sectionSlug: 'infrastructure',
      permissions: [{ module: 'infrastructure', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Public Health Officer',
      slug: 'health_officer',
      description: 'Head of Health Services',
      isSystem: false,
      level: 2,
      sectionSlug: 'health',
      permissions: [{ module: 'health', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Education Coordinator',
      slug: 'education_coordinator',
      description: 'Head of Education',
      isSystem: false,
      level: 2,
      sectionSlug: 'education',
      permissions: [{ module: 'education', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Legal Officer',
      slug: 'legal_officer',
      description: 'Head of Judicial Support',
      isSystem: false,
      level: 2,
      sectionSlug: 'legal',
      permissions: [{ module: 'complaints', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Agriculture / Veterinary Officer',
      slug: 'agriculture_officer',
      description: 'Head of Agriculture and Veterinary',
      isSystem: false,
      level: 2,
      sectionSlug: 'agriculture',
      permissions: [{ module: 'agriculture', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Nayab Subba',
      slug: 'nayab_subba',
      description: 'Non-Gazetted First Class Administrator',
      isSystem: false,
      level: 4,
      permissions: [{ module: 'candidates', action: 'manage' }, { module: 'registrations', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Accountant',
      slug: 'accountant',
      description: 'Financial Management',
      isSystem: false,
      level: 4,
      sectionSlug: 'finance',
      permissions: [{ module: 'revenue', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Sub-Engineer',
      slug: 'sub_engineer',
      description: 'Infrastructure execution and monitoring',
      isSystem: false,
      level: 4,
      sectionSlug: 'infrastructure',
      permissions: [{ module: 'infrastructure', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Health Assistant / Staff Nurse',
      slug: 'health_assistant',
      description: 'Mid-level health worker',
      isSystem: false,
      level: 4,
      sectionSlug: 'health',
      permissions: [{ module: 'health', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'IT Officer',
      slug: 'it_officer',
      description: 'IT Systems manager',
      isSystem: false,
      level: 4,
      permissions: [{ module: 'all', action: 'manage' }]
    },
    {
      tenantId: tenant._id,
      name: 'Kharidar',
      slug: 'kharidar',
      description: 'Non-Gazetted Second Class Administrator',
      isSystem: false,
      level: 4,
      permissions: [{ module: 'candidates', action: 'create' }, { module: 'registrations', action: 'create' }]
    },
    {
      tenantId: tenant._id,
      name: 'Computer Operator',
      nameNp: 'कम्प्युटर अपरेटर',
      slug: 'computer_operator',
      description: 'Data Entry Operator',
      isSystem: false,
      level: 4,
      permissions: [
        { module: 'candidates', action: 'create' },
        { module: 'candidates', action: 'read' },
        { module: 'registrations', action: 'create' },
        { module: 'registrations', action: 'read' }
      ]
    },
    {
      tenantId: tenant._id,
      name: 'Overseer',
      slug: 'overseer',
      description: 'Junior technical staff for infrastructure',
      isSystem: false,
      level: 4,
      sectionSlug: 'infrastructure',
      permissions: [{ module: 'infrastructure', action: 'read' }]
    },
    {
      tenantId: tenant._id,
      name: 'Lab Technician / ANM',
      slug: 'lab_technician',
      description: 'Junior health worker',
      isSystem: false,
      level: 4,
      sectionSlug: 'health',
      permissions: [{ module: 'health', action: 'read' }]
    },
    {
      tenantId: tenant._id,
      name: 'Junior Technical Assistant (JTA)',
      slug: 'jta',
      description: 'Junior agriculture technical staff',
      isSystem: false,
      level: 4,
      sectionSlug: 'agriculture',
      permissions: [{ module: 'agriculture', action: 'read' }]
    },
    {
      tenantId: tenant._id,
      name: 'Municipal Police',
      slug: 'municipal_police',
      description: 'City Police Force',
      isSystem: false,
      level: 4,
      permissions: []
    },
    {
      tenantId: tenant._id,
      name: 'Office Assistant (Karyalaya Sahayogi)',
      nameNp: 'कार्यालय सहयोगी',
      slug: 'office_assistant',
      description: 'Support staff',
      isSystem: false,
      level: 4,
      permissions: []
    },
    {
      tenantId: tenant._id,
      name: 'Driver',
      slug: 'driver',
      description: 'Vehicle operator',
      isSystem: false,
      level: 4,
      permissions: []
    },
    {
      tenantId: tenant._id,
      name: 'Sanitation Worker',
      slug: 'sanitation_worker',
      description: 'Waste management and sanitation',
      isSystem: false,
      level: 4,
      permissions: []
    }
  ];

  for (const roleData of roles) {
    const existing = await Role.findOne({ tenantId: tenant._id, slug: roleData.slug });
    if (!existing) {
      await Role.create(roleData);
    }
  }

  console.log('✅ Roles seeded successfully.');
}
