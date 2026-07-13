const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');

code = code.replace(/rgba\(99,102,241,0.2\)/g, 'rgba(132,204,22,0.2)');
code = code.replace(/rgba\(99,102,241,0.3\)/g, 'rgba(132,204,22,0.3)');
code = code.replace(/rgba\(99,102,241,0.5\)/g, 'rgba(132,204,22,0.5)');

fs.writeFileSync('src/app/page.tsx', code);
console.log('Fixed shadows');
