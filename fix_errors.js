const fs = require('fs');

const files = [
  'src/modules/finance/finance.controller.ts',
  'src/modules/infra-payments/infra-payments.controller.ts',
  'src/modules/dashboard/dashboard.controller.ts'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/sendError\(res,\s*("[^"]+"),\s*(\d+)(,\s*\[.*?\])?\)/g, 'sendError(res, $2, $1$3)');
  fs.writeFileSync(file, content);
}
