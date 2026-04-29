import React from 'react';

export type FrameType = 
  | 'nenhuma' | 'menina' | 'menino' | 'aniversario' | 'batismo' 
  | 'crisma' | 'eucaristia' | 'retiro' | 'maria' | 'paz' 
  | 'arcoiris' | 'festivo' | 'madeira' | 'ceu' | 'natureza' 
  | 'aquarela' | 'dourado' | 'jovial' | 'vitral' | 'polaroid' | 'cruz';

export interface FrameDef {
  id: FrameType;
  name: string;
  Overlay: React.FC;
}

export const FRAMES: FrameDef[] = [
  { id: 'nenhuma', name: 'Limpa', Overlay: () => null },
  { id: 'menina', name: 'Rosa Menina', Overlay: () => (
    <div className="absolute inset-0 border-[16px] border-pink-200/90 mix-blend-multiply flex items-center justify-center p-2 pointer-events-none">
      <div className="w-full h-full border-[3px] border-dashed border-pink-400 rounded-xl" />
      <div className="absolute top-4 left-4 w-6 h-6 bg-pink-400 rounded-full opacity-60" />
      <div className="absolute bottom-4 right-4 w-8 h-8 bg-pink-300 rounded-full opacity-60" />
    </div>
  )},
  { id: 'menino', name: 'Azul Menino', Overlay: () => (
    <div className="absolute inset-0 border-[16px] border-blue-200/90 mix-blend-multiply flex items-center justify-center p-2 pointer-events-none">
      <div className="w-full h-full border-[3px] border-blue-500 rounded-xl" />
      <svg className="absolute top-2 left-2 w-10 h-10 text-blue-500 opacity-60" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z" />
      </svg>
      <svg className="absolute bottom-2 right-2 w-8 h-8 text-blue-400 opacity-60" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1z" />
      </svg>
    </div>
  )},
  { id: 'aniversario', name: 'Aniversário', Overlay: () => (
    <div className="absolute inset-0 border-[12px] border-yellow-400/80 p-2 pointer-events-none">
       <div className="absolute top-0 left-0 right-0 h-10 overflow-hidden flex justify-around">
          {[...Array(6)].map((_, i) => (
             <div key={i} className="w-6 h-6 bg-red-400 -mt-2 rotate-45 transform origin-center shadow-sm" />
          ))}
       </div>
       <div className="absolute bottom-4 w-full text-center">
         <span className="bg-yellow-400 text-yellow-900 font-black px-6 py-1 rounded-full uppercase tracking-widest text-sm shadow-md">Feliz Vida</span>
       </div>
    </div>
  )},
  { id: 'batismo', name: 'Batismo', Overlay: () => (
    <div className="absolute inset-0 border-[20px] border-white/80 mix-blend-overlay p-2 pointer-events-none">
       <div className="w-full h-full border-[1px] border-yellow-500 opacity-50 rounded-sm" />
       <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 opacity-70">
         <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2}>
           <path d="M12 2v20M6 8h12" />
         </svg>
       </div>
    </div>
  )},
  { id: 'crisma', name: 'Crisma', Overlay: () => (
    <div className="absolute inset-0 border-[16px] border-red-600/30 p-2 pointer-events-none mix-blend-color-burn">
       <div className="w-full h-full border-2 border-red-500 opacity-80" />
       <div className="absolute bottom-2 left-2 text-red-500">
         <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
           <path d="M12 2c0 0-4 4-4 10a4 4 0 0 0 8 0c0-6-4-10-4-10zm0 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
         </svg>
       </div>
    </div>
  )},
  { id: 'eucaristia', name: 'Eucaristia', Overlay: () => (
    <div className="absolute inset-0 border-[12px] border-amber-100/90 pointer-events-none p-3">
       <div className="w-full h-full border-t-[8px] border-b-[8px] border-amber-400/60 rounded-[30px]" />
       <div className="absolute top-4 right-4 bg-amber-400 w-12 h-12 rounded-full flex items-center justify-center opacity-80 shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} className="w-6 h-6"><path d="M12 2v8M8 6h8" /></svg>
       </div>
    </div>
  )},
  { id: 'retiro', name: 'Retiro', Overlay: () => (
    <div className="absolute inset-0 border-[10px] border-indigo-900/60 mix-blend-hard-light pointer-events-none flex flex-col justify-end">
       <div className="h-1/3 bg-gradient-to-t from-indigo-900/80 to-transparent w-full flex items-end p-4">
         <span className="text-white/90 font-black tracking-widest uppercase text-xl">Retiro</span>
       </div>
    </div>
  )},
  { id: 'maria', name: 'Mãe Maria', Overlay: () => (
    <div className="absolute inset-0 border-[14px] border-sky-300/80 pointer-events-none">
       <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-sky-500 rounded-tl-xl opacity-60" />
       <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-sky-500 rounded-br-xl opacity-60" />
       <div className="absolute bottom-4 left-4 bg-sky-50 text-sky-800 font-serif italic text-sm px-3 py-1 rounded-full opacity-90 shadow-sm border border-sky-200">Salve Maria</div>
    </div>
  )},
  { id: 'paz', name: 'Paz', Overlay: () => (
    <div className="absolute inset-0 border-[18px] border-white/90 pointer-events-none p-1">
      <div className="w-full h-full border border-emerald-200" />
      <div className="absolute top-1 right-1 p-2 bg-emerald-50 rounded-full shadow-sm text-emerald-600">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M21 2c0 0-4.5.5-7 3s-3.5 6-3.5 6l-6 .5-2.5 3 4.5.5 3 4s3.5-1 4-3.5l3.5-3.5S22.5 6 23 2h-2z" />
        </svg>
      </div>
    </div>
  )},
  { id: 'arcoiris', name: 'Alegria', Overlay: () => (
    <div className="absolute inset-0 border-[12px] border-transparent pointer-events-none" style={{ borderImage: 'linear-gradient(45deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa) 1' }}>
    </div>
  )},
  { id: 'festivo', name: 'Festa', Overlay: () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <div key={i} className={`absolute w-3 h-4 rounded-sm ${['bg-red-400', 'bg-blue-400', 'bg-yellow-400', 'bg-green-400'][i%4]} opacity-70`} style={{
          left: `${(i * 37) % 90}%`,
          top: i % 2 === 0 ? `${(i * 13) % 20}%` : `${80 + (i * 7) % 15}%`,
          transform: `rotate(${i * 45}deg)`
        }} />
      ))}
      <div className="absolute inset-0 border-8 border-yellow-200 mix-blend-overlay" />
    </div>
  )},
  { id: 'madeira', name: 'Madeira', Overlay: () => (
    <div className="absolute inset-0 border-[18px] border-[#8b5a2b] shadow-inner pointer-events-none mix-blend-multiply opacity-80" style={{ borderStyle: 'solid' }}>
      <div className="w-full h-full border border-[#5c3a21]" />
    </div>
  )},
  { id: 'ceu', name: 'Estrelado', Overlay: () => (
    <div className="absolute inset-0 border-[24px] border-slate-900/40 pointer-events-none relative mix-blend-overlay">
       {[...Array(15)].map((_, i) => (
        <div key={i} className="absolute bg-white rounded-full" style={{
          width: i%3 === 0 ? '4px' : '2px', height: i%3 === 0 ? '4px' : '2px',
          left: `${(i * 47) % 95}%`, top: `${(i * 23) % 95}%`
        }} />
       ))}
    </div>
  )},
  { id: 'natureza', name: 'Natureza', Overlay: () => (
    <div className="absolute inset-0 border-[20px] border-green-100/80 pointer-events-none flex flex-col justify-between">
      <div className="w-full h-4 bg-green-500/40" />
      <div className="w-full h-4 bg-green-500/40" />
    </div>
  )},
  { id: 'aquarela', name: 'Aquarela', Overlay: () => (
    <div className="absolute inset-0 border-[25px] border-purple-200/50 pointer-events-none mix-blend-color p-4">
      <div className="w-full h-full rounded-[40px] shadow-[0_0_40px_rgba(192,132,252,0.8)_inset]" />
    </div>
  )},
  { id: 'dourado', name: 'Dourado Real', Overlay: () => (
    <div className="absolute inset-0 border-[10px] border-yellow-500/90 pointer-events-none p-1 shadow-2xl">
      <div className="w-full h-full border-[2px] border-yellow-300" />
    </div>
  )},
  { id: 'jovial', name: 'Jovens', Overlay: () => (
    <div className="absolute inset-0 border-[16px] border-orange-400/90 pointer-events-none">
       <div className="w-full h-full border-[4px] border-dashed border-orange-200" />
    </div>
  )},
  { id: 'vitral', name: 'Vitral', Overlay: () => (
    <div className="absolute inset-0 border-[14px] border-slate-800/90 pointer-events-none">
       <div className="w-full h-2 flex">
         <div className="flex-1 bg-red-500" /><div className="flex-1 bg-blue-500" /><div className="flex-1 bg-yellow-400" /><div className="flex-1 bg-green-500" />
       </div>
       <div className="absolute bottom-0 w-full h-2 flex">
         <div className="flex-1 bg-green-500" /><div className="flex-1 bg-yellow-400" /><div className="flex-1 bg-blue-500" /><div className="flex-1 bg-red-500" />
       </div>
    </div>
  )},
  { id: 'polaroid', name: 'Polaroid', Overlay: () => (
    <div className="absolute inset-0 bg-white pointer-events-none opacity-90 p-3 pb-[80px]">
       <div className="w-full h-full mix-blend-destination" style={{ boxShadow: '0 0 0 9999px white', background: 'transparent' }} />
       <div className="absolute bottom-0 left-0 w-full h-[80px] bg-white flex items-center justify-center border-t border-zinc-100">
       </div>
    </div>
  )},
  { id: 'cruz', name: 'Cruzes', Overlay: () => (
    <div className="absolute inset-0 pointer-events-none">
       <div className="absolute top-2 left-2 text-primary opacity-60"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20m-10-10h20"/></svg></div>
       <div className="absolute top-2 right-2 text-primary opacity-60"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20m-10-10h20"/></svg></div>
       <div className="absolute bottom-2 left-2 text-primary opacity-60"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20m-10-10h20"/></svg></div>
       <div className="absolute bottom-2 right-2 text-primary opacity-60"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20m-10-10h20"/></svg></div>
    </div>
  )},
];
