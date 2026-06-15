const url = "https://ylrpddmhtlujncglsptn.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscnBkZG1odGx1am5jZ2xzcHRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzE4ODMsImV4cCI6MjA5MTI0Nzg4M30.H01FFVbHOcDWhVIfSyOV22rEw6MT2NQKzMVscWGxJWU";

async function test() {
  try {
    // 1. Sign up a random user
    const email = `test_${Date.now()}@example.com`;
    const password = "password123";
    
    console.log("Signing up user:", email);
    let res = await fetch(`${url}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "apikey": key,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
    let data = await res.json();
    if (!res.ok) {
      console.error("Signup failed:", data);
      return;
    }
    
    // Some supabase instances require email confirmation, if so, we can't test this way easily,
    // but usually it returns a session immediately if email confirmation is off.
    let token = data.session?.access_token;
    
    if (!token) {
      // Try to login
      res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          "apikey": key,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });
      data = await res.json();
      token = data.access_token;
    }
    
    if (!token) {
      console.error("Could not get access token. Email confirmation might be required.");
      return;
    }
    
    console.log("Got access token! Calling Edge Function...");
    
    // 2. Call the Edge function
    const fnUrl = `${url}/functions/v1/create-mp-preference`;
    const fnRes = await fetch(fnUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log("Edge Function status:", fnRes.status);
    const text = await fnRes.text();
    console.log("Edge Function response:", text);
    
  } catch (err) {
    console.error("Script error:", err);
  }
}

test();
