const fs = require('fs');
let seed = fs.readFileSync('src/utils/seed.ts', 'utf8');
let imports = seed.match(/import.*?from.*?;/g).join('\n');
console.log(imports);
