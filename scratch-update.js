const fs = require('fs');
let seedMore = fs.readFileSync('src/utils/seed-more.ts', 'utf8');
let originalSeed = fs.readFileSync('src/utils/seed.ts', 'utf8');

// Get all imports
let imports = originalSeed.match(/import.*?from.*?;/g).join('\n');
imports += '\nimport { SYSTEM_ROLES } from "./seed";\n';

// Replace imports in seedMore
seedMore = seedMore.replace(/import mongoose[\s\S]*?from "\.\/seed";/, imports);

// Extract the missing blocks from seed.ts (from Complaints to the end of the citizen/ward1 check)
// Line 359 to 613
let lines = originalSeed.split('\n');
let missingLogic = lines.slice(358, 613).join('\n');

// Find the injection point in seedMore
let injectionPoint = 'console.log("✓ Demo citizen seeded");\n      }\n    }';

seedMore = seedMore.replace(injectionPoint, injectionPoint + "\n\n    const adminUser = existingAdmin;\n    const citizen = await Citizen.findOne({ municipalityId: municipality._id });\n" + missingLogic);

fs.writeFileSync('src/utils/seed-more.ts', seedMore);
console.log("Done");
