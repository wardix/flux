const fs = require('fs');
const content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

function countTags(tagName) {
  const openRegex = new RegExp(`<${tagName}\\b[^>]*>`, 'g');
  const closeRegex = new RegExp(`</${tagName}>`, 'g');
  
  // Exclude self-closing tags (roughly)
  const allOpens = [...content.matchAll(openRegex)].filter(m => !m[0].endsWith('/>'));
  const allCloses = [...content.matchAll(closeRegex)];
  
  console.log(`${tagName}: open ${allOpens.length}, close ${allCloses.length}`);
}

countTags('div');
countTags('svg');
countTags('main');
countTags('header');
countTags('path');
