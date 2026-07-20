const fs = require('fs');
let content = fs.readFileSync('src/utils/seed-more.ts', 'utf8');

// Fix Complaints
content = content.replace(/"CMP-0001"/g, '`CMP-0001-${t.code}`');
content = content.replace(/"CMP-0002"/g, '`CMP-0002-${t.code}`');
content = content.replace(/"CMP-0003"/g, '`CMP-0003-${t.code}`');

// Fix Correspondence
content = content.replace(/"COR-2081-001"/g, '`COR-2081-001-${t.code}`');
content = content.replace(/"COR-2081-002"/g, '`COR-2081-002-${t.code}`');
content = content.replace(/"COR-2081-003"/g, '`COR-2081-003-${t.code}`');

// Fix Service Requests
content = content.replace(/"SR-0001"/g, '`SR-0001-${t.code}`');
content = content.replace(/"SR-0002"/g, '`SR-0002-${t.code}`');
content = content.replace(/"SR-0003"/g, '`SR-0003-${t.code}`');

// Fix Registrations
content = content.replace(/"BR-0001"/g, '`BR-0001-${t.code}`');
content = content.replace(/"DR-0001"/g, '`DR-0001-${t.code}`');
content = content.replace(/"MR-0001"/g, '`MR-0001-${t.code}`');

// Fix Revenue
content = content.replace(/"REC-2081-001"/g, '`REC-2081-001-${t.code}`');
content = content.replace(/"REC-2081-002"/g, '`REC-2081-002-${t.code}`');

fs.writeFileSync('src/utils/seed-more.ts', content);
console.log("Fixed uniqueness");
