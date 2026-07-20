const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const renames = [
  { from: 'municipality', to: 'tenant' },
  { from: 'municipalities', to: 'tenants' },
  { from: 'ward', to: 'office' },
  { from: 'wards', to: 'offices' },
  { from: 'citizen', to: 'candidate' },
  { from: 'citizens', to: 'candidates' },
  { from: 'service-request', to: 'demand' },
  { from: 'service-requests', to: 'demands' },
];

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const oldPath = path.join(dir, file);
    let newFileName = file;
    
    for (const r of renames) {
      if (newFileName.includes(r.from)) {
        newFileName = newFileName.replace(new RegExp(r.from, 'g'), r.to);
      }
    }

    const newPath = path.join(dir, newFileName);
    if (oldPath !== newPath) {
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: ${oldPath} -> ${newPath}`);
    }

    const stat = fs.statSync(newPath);
    if (stat.isDirectory()) {
      processDir(newPath);
    }
  }
}

processDir(srcDir);
