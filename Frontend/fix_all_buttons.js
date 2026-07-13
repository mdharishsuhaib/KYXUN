const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Find tags containing the linear gradient
  const tagRegex = /<[^>]*linear-gradient\(135deg,\s*var\(--kyxun-accent\),\s*var\(--kyxun-accent-secondary\)\)[^>]*>/g;
  
  content = content.replace(tagRegex, (match) => {
    let newTag = match;

    // 1. Remove standard gradient style
    newTag = newTag.replace(/\s*style=\{\{\s*background:\s*["']linear-gradient\(135deg,\s*var\(--kyxun-accent\),\s*var\(--kyxun-accent-secondary\)\)["']\s*\}\}/g, '');
    newTag = newTag.replace(/\s*style=\{\{background:\s*["']linear-gradient\(135deg,\s*var\(--kyxun-accent\),\s*var\(--kyxun-accent-secondary\)\)["']\}\}/g, '');
    
    // 2. Fix the success ternary gradient
    newTag = newTag.replace(/linear-gradient\(135deg,\s*var\(--kyxun-accent\),\s*var\(--kyxun-accent-secondary\)\)/g, 'var(--kyxun-accent)');

    // 3. Update classes
    // Replace kyxun-text with text-white and add bg-[var(--kyxun-accent)]
    if (newTag.includes('kyxun-text')) {
      newTag = newTag.replace(/kyxun-text/g, 'text-white bg-[var(--kyxun-accent)]');
    } else if (!newTag.includes('bg-[var(--kyxun-accent)]')) {
       // If it didn't have kyxun-text, just add the classes at the end of className
       newTag = newTag.replace(/className=["']([^"']*)["']/, 'className="\ text-white bg-[var(--kyxun-accent)]"');
    }

    // 4. Strip out shadows to remove "light effect" / glows
    newTag = newTag.replace(/\bshadow-lg\b/g, '');
    newTag = newTag.replace(/\bshadow-md\b/g, '');
    newTag = newTag.replace(/\bhover:shadow-[^\s"']+\b/g, '');

    // cleanup multiple spaces
    newTag = newTag.replace(/\s+/g, ' ');

    return newTag;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated: " + filePath);
  }
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      fixFile(fullPath);
    }
  }
}

processDir(path.join(__dirname, 'src'));
