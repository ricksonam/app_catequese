async function check() {
  try {
    const res = await fetch("https://icatequese.com.br/minha-assinatura");
    const text = await res.text();
    console.log("HTML length:", text.length);
    console.log(text.substring(0, 1000));
    
    // Find the JS bundle
    const match = text.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/);
    if (match) {
      console.log("Found bundle:", match[1]);
    }
  } catch(e) {
    console.error(e);
  }
}
check();
