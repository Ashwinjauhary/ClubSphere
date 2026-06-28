import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts') || dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const files = walkSync(srcDir);
let changedFiles = 0;
let totalReplaced = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Regex to find <img tags that don't already have loading="lazy"
  // This is a simplistic regex but should work for this codebase
  // It looks for <img followed by anything except > and replaces it with <img loading="lazy" decoding="async"
  const imgRegex = /<img(?!\s+loading="lazy")(?=\s)/g;
  
  if (imgRegex.test(content)) {
    content = content.replace(imgRegex, '<img loading="lazy" decoding="async"');
    if (content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      changedFiles++;
      totalReplaced += (content.match(/<img loading="lazy" decoding="async"/g) || []).length;
    }
  }
}

console.log(`Updated ${changedFiles} files with ${totalReplaced} lazy loading attributes.`);
