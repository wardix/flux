const fs = require('fs');
const content = fs.readFileSync('frontend/src/App.tsx', 'utf8');

// Basic parser to find unclosed JSX tags
const lines = content.split('\n');
let stack = [];
let insideComment = false;

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.includes('/*')) insideComment = true;
    if (line.includes('*/')) { insideComment = false; continue; }
    if (insideComment) continue;

    // Remove string literals to avoid matching tags inside strings
    line = line.replace(/(['"`]).*?\1/g, '""');

    // Simple tag matcher: <Tag ...> or </Tag> or <Tag ... />
    const regex = /<\/?([a-zA-Z0-9_.-]+)(?:\s+[^>]*?)?\/?>/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
        const fullMatch = match[0];
        const tagName = match[1];

        if (fullMatch.startsWith('</')) {
            // Closing tag
            if (stack.length > 0 && stack[stack.length - 1].tag === tagName) {
                stack.pop();
            } else {
                console.log(`Mismatch at line ${i + 1}: expected </${stack[stack.length-1]?.tag}>, found ${fullMatch}`);
            }
        } else if (fullMatch.endsWith('/>')) {
            // Self-closing
        } else {
            // Opening tag
            const selfClosingTags = ['input', 'img', 'br', 'hr', 'path', 'svg']; // svg is not self-closing but we might miss it
            if (!selfClosingTags.includes(tagName) && tagName) {
                stack.push({ tag: tagName, line: i + 1 });
            }
        }
    }
}
console.log('Remaining in stack:', stack);
