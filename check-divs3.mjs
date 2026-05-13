import fs from 'fs';

let content = fs.readFileSync('src/pages/ReunioesList.tsx', 'utf-8');

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
        let j = i;
        while (content[j] !== '>' && j < content.length) {
            if (content[j] === '\n') line++;
            j++;
        }
        if (content[j - 1] !== '/') {
            if (line >= 256 && line <= 705) console.log(`PUSH div at ${line}`);
            stack.push(`div at ${line}`);
        }
        i = j + 1;
        continue;
    }

    if (content.substring(i).startsWith('</div>')) {
        let top = stack.pop();
        if (line >= 256 && line <= 705) console.log(`POP ${top} by </div> at ${line}`);
        i += 6;
        continue;
    }

    i++;
}
