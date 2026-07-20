const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = [
  { from: /Municipality/g, to: 'Tenant' },
  { from: /municipality/g, to: 'tenant' },
  { from: /MUNICIPALITY/g, to: 'TENANT' },
  
  { from: /Ward/g, to: 'Office' },
  { from: /wardId/g, to: 'officeId' },
  { from: /wardNumber/g, to: 'officeNumber' },
  { from: /\bward\b/g, to: 'office' }, // exact match lowercase
  { from: /\bwards\b/g, to: 'offices' },
  
  { from: /Citizen/g, to: 'Candidate' },
  { from: /citizenId/g, to: 'candidateId' },
  { from: /\bcitizen\b/g, to: 'candidate' },
  { from: /\bcitizens\b/g, to: 'candidates' },
  
  { from: /ServiceRequest/g, to: 'Demand' },
  { from: /serviceRequest/g, to: 'demand' },
  { from: /serviceRequests/g, to: 'demands' },
  { from: /SERVICE_REQUEST/g, to: 'DEMAND' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') && !fullPath.includes('/models/')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      for (const replace of replacements) {
        content = content.replace(replace.from, replace.to);
      }
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(srcDir);
