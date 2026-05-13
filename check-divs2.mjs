import fs from 'fs';

let content = fs.readFileSync('src/pages/ReunioesList.tsx', 'utf-8');

// Replace all newlines inside tags with spaces so we can regex them easily line-by-line
// Actually, let's just do a simple character-by-character parser.

let stack = [];
let i = 0;
let line = 1;

while (i < content.length) {
    if (content[i] === '\n') {
        line++;
        i++;
        continue;
    }

    if (content.substring(i).startsWith('<div') && !content.substring(i).startsWith('</div>')) {
        // find end of tag
        let j = i;
        while (content[j] !== '>' && j < content.length) {
            if (content[j] === '\n') line++;
            j++;
        }
        if (content[j - 1] !== '/') {
            stack.push(`div at ${line}`);
        }
        i = j + 1;
        continue;
    }

    if (content.substring(i).startsWith('</div>')) {
        let top = stack.pop();
        if (!top?.startsWith('div')) {
            console.log(`Mismatched </div> at line ${line}`);
        }
        i += 6;
        continue;
    }

    if (content.substring(i).startsWith('<DialogContent') && !content.substring(i).startsWith('</DialogContent>')) {
        let j = i;
        while (content[j] !== '>' && j < content.length) {
            if (content[j] === '\n') line++;
            j++;
        }
        if (content[j - 1] !== '/') {
            stack.push(`DialogContent at ${line}`);
        }
        i = j + 1;
        continue;
    }

    if (content.substring(i).startsWith('</DialogContent>')) {
        let top = stack.pop();
        if (!top?.startsWith('DialogContent')) {
            console.log(`Mismatched </DialogContent> at line ${line}, expected to pop ${top}`);
        }
        i += 16;
        continue;
    }

    // skip other tags to avoid slowing down too much, just basic advance
    i++;
}

console.log("Remaining stack:", stack);
