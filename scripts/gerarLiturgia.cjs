const fs = require('fs');
const path = require('path');

const fetchLiturgy = async (year) => {
  const data = {};
  console.log(`Starting download for year ${year}...`);

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const d = String(day).padStart(2, '0');
      const m = String(month).padStart(2, '0');
      const y = year;
      const url = `https://liturgia.up.railway.app/?dia=${d}&mes=${m}&ano=${y}`;
      
      const dateKey = `${m}-${d}`;
      
      let success = false;
      let retries = 0;
      
      while (!success && retries < 5) {
        try {
          if (retries > 0) {
            console.log(`Retry ${retries} for ${d}/${m}/${y}...`);
            await new Promise(r => setTimeout(r, 2000));
          }
          
          const res = await fetch(url);
          if (res.ok) {
            const json = await res.json();
            data[dateKey] = json;
            success = true;
            process.stdout.write(`\rFetched: ${d}/${m}/${y}`);
          } else {
            retries++;
          }
        } catch (e) {
          retries++;
        }
      }
      
      if (!success) {
        console.error(`\nFailed to fetch ${d}/${m}/${y} after 5 retries.`);
      }
      
      // Delay between requests to not hammer the server
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log(`\nFinished downloading ${year}!`);
  
  const destDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const destPath = path.join(destDir, `liturgia_${year}.json`);
  fs.writeFileSync(destPath, JSON.stringify(data));
  console.log(`Saved to ${destPath}`);
};

const run = async () => {
  // Wake up server first
  console.log("Waking up server...");
  try { await fetch("https://liturgia.up.railway.app/"); } catch(e) {}
  
  await fetchLiturgy(2026);
  await fetchLiturgy(2027);
};

run();
