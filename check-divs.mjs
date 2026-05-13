import fs from 'fs';

const content = fs.readFileSync('src/pages/ReunioesList.tsx', 'utf-8');
const lines = content.split('\n');

let stack = [];
let lineNum = 1;

for (let line of lines) {
  // Regex for full <div> tag to check if it's self-closing
  const openMatches = [...line.matchAll(/<div([^>]*?)>/g)];
  const closeMatches = [...line.matchAll(/<\/div>/g)];

  for (let m of openMatches) {
    if (!m[0].endsWith('/>')) {
      stack.push(lineNum);
    }
  }
  for (let m of closeMatches) {
    if (stack.length > 0) {
      stack.pop();
    } else {
      console.log(`EXTRA </div> at line ${lineNum}`);
    }
  }

  // Also check DialogContent
  const dcOpen = [...line.matchAll(/<DialogContent([^>]*?)>/g)];
  const dcClose = [...line.matchAll(/<\/DialogContent>/g)];
  for (let m of dcOpen) {
    if (!m[0].endsWith('/>')) {
      stack.push(`DialogContent at ${lineNum}`);
    }
  }
  for (let m of dcClose) {
    let top = stack.pop();
    if (!top?.toString().startsWith('DialogContent')) {
        console.log(`Mismatched </DialogContent> at line ${lineNum}, expected to close: ${top}`);
    }
  }

  // Check Dialog
  const dOpen = [...line.matchAll(/<Dialog([^A-Za-z>]*[^>]*?)>/g)];
  const dClose = [...line.matchAll(/<\/Dialog>/g)];
  for (let m of dOpen) {
    if (!m[0].endsWith('/>')) {
      stack.push(`Dialog at ${lineNum}`);
    }
  }
  for (let m of dClose) {
    let top = stack.pop();
    if (!top?.toString().startsWith('Dialog at')) {
        console.log(`Mismatched </Dialog> at line ${lineNum}, expected to close: ${top}`);
    }
  }

  lineNum++;
}

console.log("Remaining unclosed elements in stack:");
console.log(stack);
