import liturgia2026 from '../data/liturgia_2026.json';
import liturgia2027 from '../data/liturgia_2027.json';

export const getLiturgiaOffline = async (date: Date) => {
  const year = date.getFullYear();
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dateKey = `${m}-${d}`;

  let liturgiaData: Record<string, any> = {};
  
  if (year === 2026) {
    liturgiaData = liturgia2026;
  } else if (year === 2027) {
    liturgiaData = liturgia2027;
  } else {
    // Se não tiver o ano offline, podemos tentar online ou retornar null
    try {
      const res = await fetch(`https://liturgia.up.railway.app/?dia=${d}&mes=${m}&ano=${year}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error("Erro na busca da liturgia futura:", e);
    }
    return null;
  }
  
  return liturgiaData[dateKey] || null;
};
