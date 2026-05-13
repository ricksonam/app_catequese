import fs from 'fs';

const content = fs.readFileSync('src/pages/ReunioesList.tsx', 'utf-8');
const lines = content.split('\n');

let divBalance = 0;
for (let i = 255; i <= 703; i++) {
    const line = lines[i];
    const openMatches = [...line.matchAll(/<div([^>]*?)>/g)];
    const closeMatches = [...line.matchAll(/<\/div>/g)];
    
    let opens = 0;
    for(let m of openMatches) {
        if(!m[0].endsWith('/>')) opens++;
    }
    let closes = closeMatches.length;
    
    divBalance += (opens - closes);
}
console.log("Div balance between 256 and 704 is:", divBalance);
