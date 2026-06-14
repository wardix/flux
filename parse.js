const parser = require('@babel/parser');
const fs = require('fs');

try {
  parser.parse(fs.readFileSync('frontend/src/App.tsx', 'utf8'), {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("No syntax errors found!");
} catch (e) {
  console.error("Syntax error:", e.message, "at line", e.loc?.line, "column", e.loc?.column);
}
