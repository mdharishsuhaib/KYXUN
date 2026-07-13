const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = [...walk('src/app'), ...walk('src/components')];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;

  // Fix where hover is after kyxun-badge- 
  content = content.replace(/(kyxun-badge-\s*)([^\"]*?hover:bg-\[var\(--kyxun-badge-(indigo|purple|rose|cyan|amber)-border\)\])/g, 'kyxun-badge-$3 $2');
  
  // Fix where hover is before kyxun-badge-
  content = content.replace(/(hover:bg-\[var\(--kyxun-badge-(indigo|purple|rose|cyan|amber)-border\)\][^\"]*?)(kyxun-badge-\s*)/g, '$1kyxun-badge-$2 ');

  // Any remaining 'kyxun-badge- ' that didn't have a hover hint (default to indigo)
  content = content.replace(/kyxun-badge-\s+/g, 'kyxun-badge-indigo ');
  
  // Also fix any 'border     text-xs' weird spacing and dangling 'border'
  content = content.replace(/kyxun-badge-(indigo|purple|rose|cyan|amber)\s+border\s+/g, 'kyxun-badge-$1 ');

  if (content !== original) {
    fs.writeFileSync(f, content);
    console.log('Fixed ' + f);
  }
}
