const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'models');

const replacements = [
  {
    file: 'Tenant.ts',
    replaces: [
      { from: /IMunicipality/g, to: 'ITenant' },
      { from: /municipalitySchema/g, to: 'tenantSchema' },
      { from: /Municipality/g, to: 'Tenant' },
      { from: /totalWards/g, to: 'totalOffices' },
    ]
  },
  {
    file: 'Office.ts',
    replaces: [
      { from: /IWard/g, to: 'IOffice' },
      { from: /wardSchema/g, to: 'officeSchema' },
      { from: /Ward/g, to: 'Office' },
      { from: /municipalityId/g, to: 'tenantId' },
      { from: /Municipality/g, to: 'Tenant' },
      { from: /wardNumber/g, to: 'officeNumber' },
    ]
  },
  {
    file: 'Candidate.ts',
    replaces: [
      { from: /ICitizen/g, to: 'ICandidate' },
      { from: /citizenSchema/g, to: 'candidateSchema' },
      { from: /Citizen/g, to: 'Candidate' },
      { from: /municipalityId/g, to: 'tenantId' },
      { from: /Municipality/g, to: 'Tenant' },
      { from: /wardId/g, to: 'officeId' },
      { from: /Ward/g, to: 'Office' },
      { from: /citizenshipNumber/g, to: 'passportNumber' },
    ]
  },
  {
    file: 'Demand.ts',
    replaces: [
      { from: /IServiceRequest/g, to: 'IDemand' },
      { from: /serviceRequestSchema/g, to: 'demandSchema' },
      { from: /ServiceRequest/g, to: 'Demand' },
      { from: /municipalityId/g, to: 'tenantId' },
      { from: /Municipality/g, to: 'Tenant' },
      { from: /wardId/g, to: 'officeId' },
      { from: /Ward/g, to: 'Office' },
      { from: /applicantName/g, to: 'employerName' },
      { from: /citizenId/g, to: 'candidateId' },
      { from: /Citizen/g, to: 'Candidate' },
    ]
  },
  {
    file: 'Role.ts',
    replaces: [
      { from: /municipalityId/g, to: 'tenantId' },
      { from: /Municipality/g, to: 'Tenant' },
    ]
  },
  {
    file: 'User.ts',
    replaces: [
      { from: /municipalityId/g, to: 'tenantId' },
      { from: /Municipality/g, to: 'Tenant' },
      { from: /wardId/g, to: 'officeId' },
      { from: /Ward/g, to: 'Office' },
    ]
  },
  {
    file: 'index.ts',
    replaces: [
      { from: /Municipality/g, to: 'Tenant' },
      { from: /Ward/g, to: 'Office' },
      { from: /Citizen/g, to: 'Candidate' },
      { from: /ServiceRequest/g, to: 'Demand' },
    ]
  }
];

for (const task of replacements) {
  const filePath = path.join(modelsDir, task.file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const replace of task.replaces) {
      content = content.replace(replace.from, replace.to);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${task.file}`);
  } else {
    console.log(`File not found: ${task.file}`);
  }
}
