const fs = require('fs');

// ==== LiturgiaDiaria.tsx ====
let liturgiaCode = fs.readFileSync('src/pages/LiturgiaDiaria.tsx', 'utf8');

liturgiaCode = liturgiaCode.replace(/from-emerald-950\/40 to-zinc-950/g, 'from-emerald-50 to-emerald-100/80');
liturgiaCode = liturgiaCode.replace(/text-emerald-400/g, 'text-emerald-800');
liturgiaCode = liturgiaCode.replace(/bg-emerald-500\/15 text-emerald-400 border-emerald-500\/30/g, 'bg-emerald-200/60 text-emerald-900 border-emerald-300');

liturgiaCode = liturgiaCode.replace(/from-amber-950\/30 to-zinc-950/g, 'from-amber-50 to-amber-100/80');
liturgiaCode = liturgiaCode.replace(/text-amber-300/g, 'text-amber-800');
liturgiaCode = liturgiaCode.replace(/bg-amber-400\/15 text-amber-300 border-amber-400\/30/g, 'bg-amber-200/60 text-amber-900 border-amber-300');

liturgiaCode = liturgiaCode.replace(/from-red-950\/40 to-zinc-950/g, 'from-red-50 to-red-100/80');
liturgiaCode = liturgiaCode.replace(/text-red-400/g, 'text-red-800');
liturgiaCode = liturgiaCode.replace(/bg-red-500\/15 text-red-400 border-red-500\/30/g, 'bg-red-200/60 text-red-900 border-red-300');

liturgiaCode = liturgiaCode.replace(/from-purple-950\/40 to-zinc-950/g, 'from-purple-50 to-purple-100/80');
liturgiaCode = liturgiaCode.replace(/text-purple-400/g, 'text-purple-800');
liturgiaCode = liturgiaCode.replace(/bg-purple-500\/15 text-purple-400 border-purple-500\/30/g, 'bg-purple-200/60 text-purple-900 border-purple-300');

liturgiaCode = liturgiaCode.replace(/from-pink-950\/40 to-zinc-950/g, 'from-pink-50 to-pink-100/80');
liturgiaCode = liturgiaCode.replace(/text-pink-400/g, 'text-pink-800');
liturgiaCode = liturgiaCode.replace(/bg-pink-500\/15 text-pink-400 border-pink-500\/30/g, 'bg-pink-200/60 text-pink-900 border-pink-300');

liturgiaCode = liturgiaCode.replace(/bg-zinc-950\/80/g, 'bg-white/90');
liturgiaCode = liturgiaCode.replace(/bg-zinc-950/g, 'bg-slate-50');

liturgiaCode = liturgiaCode.replace(/text-white\/90/g, 'text-zinc-900');
liturgiaCode = liturgiaCode.replace(/text-white\/70/g, 'text-zinc-700');
liturgiaCode = liturgiaCode.replace(/text-white\/60/g, 'text-zinc-600');
liturgiaCode = liturgiaCode.replace(/text-white\/50/g, 'text-zinc-500');
liturgiaCode = liturgiaCode.replace(/text-white\/40/g, 'text-zinc-500');
liturgiaCode = liturgiaCode.replace(/text-white\/30/g, 'text-zinc-400');
liturgiaCode = liturgiaCode.replace(/text-white\/20/g, 'text-zinc-400');
liturgiaCode = liturgiaCode.replace(/text-white/g, 'text-zinc-900');

liturgiaCode = liturgiaCode.replace(/bg-white\/4 /g, 'bg-white/80 ');
liturgiaCode = liturgiaCode.replace(/bg-white\/5 /g, 'bg-black/5 ');
liturgiaCode = liturgiaCode.replace(/bg-white\/5\"/g, 'bg-black/5\"');
liturgiaCode = liturgiaCode.replace(/bg-white\/6/g, 'bg-black/5');
liturgiaCode = liturgiaCode.replace(/bg-white\/8/g, 'bg-black/10');
liturgiaCode = liturgiaCode.replace(/bg-white\/10/g, 'bg-black/10');
liturgiaCode = liturgiaCode.replace(/bg-white\/12/g, 'bg-black/5');
liturgiaCode = liturgiaCode.replace(/bg-white\/15/g, 'bg-white/90');

liturgiaCode = liturgiaCode.replace(/border-white\/5/g, 'border-black/5');
liturgiaCode = liturgiaCode.replace(/border-white\/8/g, 'border-black/5');
liturgiaCode = liturgiaCode.replace(/border-white\/10/g, 'border-black/10');
liturgiaCode = liturgiaCode.replace(/border-white\/20/g, 'border-black/20');

liturgiaCode = liturgiaCode.replace(/shadow-black\/20/g, 'shadow-black/5');

fs.writeFileSync('src/pages/LiturgiaDiaria.tsx', liturgiaCode);
console.log('LiturgiaDiaria.tsx alterado');

// ==== SorteioNomes.tsx ====
let sorteioCode = fs.readFileSync('src/pages/SorteioNomes.tsx', 'utf8');

sorteioCode = sorteioCode.replace(/from-violet-600 via-purple-600 to-indigo-700/g, 'from-rose-300 via-orange-200 to-rose-300');
sorteioCode = sorteioCode.replace(/from-zinc-900\/95 to-zinc-800\/95/g, 'from-orange-50 to-rose-50');

sorteioCode = sorteioCode.replace(/text-white uppercase tracking-\[0.2em\]/g, 'text-rose-950 uppercase tracking-[0.2em]');
sorteioCode = sorteioCode.replace(/text-purple-300/g, 'text-rose-700/80');
sorteioCode = sorteioCode.replace(/text-white\/80/g, 'text-rose-950/80');
sorteioCode = sorteioCode.replace(/text-white\/40/g, 'text-rose-950/50');
sorteioCode = sorteioCode.replace(/text-violet-200/g, 'text-rose-900');

sorteioCode = sorteioCode.replace(/from-violet-500 to-purple-600 text-white/g, 'from-rose-400 to-orange-400 text-white');
sorteioCode = sorteioCode.replace(/from-violet-500 to-purple-600 flex items-center justify-center/g, 'from-rose-400 to-orange-400 flex items-center justify-center');
sorteioCode = sorteioCode.replace(/shadow-violet-500\/40/g, 'shadow-rose-500/40');
sorteioCode = sorteioCode.replace(/shadow-purple-500\/30/g, 'shadow-rose-400/30');

sorteioCode = sorteioCode.replace(/border-white\/10 hover:border-violet-400\/40 bg-white\/5 hover:bg-white\/10/g, 'border-rose-950/10 hover:border-rose-400/40 bg-rose-950/5 hover:bg-rose-950/10');
sorteioCode = sorteioCode.replace(/bg-white\/10 text-purple-300 group-hover:bg-violet-500\/30 group-hover:text-violet-200/g, 'bg-rose-950/10 text-rose-700/80 group-hover:bg-rose-400/30 group-hover:text-rose-900');
sorteioCode = sorteioCode.replace(/border-violet-400 bg-violet-500\/20 shadow-md shadow-violet-500\/20/g, 'border-rose-400 bg-rose-400/20 shadow-md shadow-rose-400/20');

sorteioCode = sorteioCode.replace(/from-violet-500\/10 to-purple-500\/5/g, 'from-rose-400/10 to-orange-400/5');
sorteioCode = sorteioCode.replace(/bg-violet-400/g, 'bg-rose-400');

fs.writeFileSync('src/pages/SorteioNomes.tsx', sorteioCode);
console.log('SorteioNomes.tsx alterado');
