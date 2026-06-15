const url = "https://ylrpddmhtlujncglsptn.supabase.co/functions/v1/create-mp-preference";

async function test() {
  try {
    const res = await fetch(url, { method: "OPTIONS" });
    console.log("OPTIONS status:", res.status);
    
    const postRes = await fetch(url, { 
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    console.log("POST status:", postRes.status);
    const text = await postRes.text();
    console.log("POST body:", text);
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

test();
