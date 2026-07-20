const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src');

function replaceInFile(filePath, replacements) {
  const fullPath = path.join(rootDir, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    for (const r of replacements) {
      if (content.includes(r.from)) {
        content = content.replace(new RegExp(r.from, 'g'), r.to);
        modified = true;
      }
    }
    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
}

// 1. app.ts
replaceInFile('app.ts', [
  { from: 'service-requests.routes', to: 'demands.routes' },
  { from: 'service-requests/demands', to: 'demands/demands' },
]);

// 2. Document.ts
replaceInFile('models/Document.ts', [
  { from: 'municipalityId', to: 'tenantId' },
]);

// 3. IFeatureFlag inside FeatureFlag.ts
replaceInFile('models/FeatureFlag.ts', [
  { from: 'enabledWards', to: 'enabledOffices' },
  { from: 'municipalityId', to: 'tenantId' },
]);
// 4. FeatureFlag middleware
replaceInFile('middleware/featureFlag.middleware.ts', [
  { from: 'enabledWards', to: 'enabledOffices' }
]);

// 5. demands.controller.ts
replaceInFile('modules/demands/demands.controller.ts', [
  { from: 'applicantName', to: 'employerName' }
]);

// 6. demands.routes.ts
replaceInFile('modules/demands/demands.routes.ts', [
  { from: 'service-requests.controller', to: 'demands.controller' }
]);

// 7. 5-registrations.seed.ts
replaceInFile('scripts/seeders/5-registrations.seed.ts', [
  { from: 'citizenshipNumber', to: 'passportNumber' }
]);

// 8. 4-candidates.seed.ts (maybe missed citizenshipNumber?)
replaceInFile('scripts/seeders/4-candidates.seed.ts', [
  { from: 'citizenshipNumber', to: 'passportNumber' }
]);

// 9. run.ts seeder imports
replaceInFile('scripts/seeders/run.ts', [
  { from: '1-municipality.seed', to: '1-tenant.seed' },
  { from: '4-citizens.seed', to: '4-candidates.seed' },
]);
