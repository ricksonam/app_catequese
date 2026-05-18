import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log(`[activate-premium] Called with method: ${req.method}`);
    
    let token: string | null = null;
    let transactionId: string | null = null;

    // 1. Parse token and transactionId from request
    const authHeader = req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Try to parse query parameters
    const url = new URL(req.url);
    const queryToken = url.searchParams.get("token");
    if (queryToken) token = queryToken;

    const queryTxId = url.searchParams.get("transactionId") || 
                      url.searchParams.get("transaction_id") || 
                      url.searchParams.get("nsu") || 
                      url.searchParams.get("invoice_slug") || 
                      url.searchParams.get("slug");
    if (queryTxId) transactionId = queryTxId;

    // Try to parse JSON body (only for POST/PUT)
    if (req.method === "POST" || req.method === "PUT") {
      try {
        const body = await req.json();
        if (body.token) token = body.token;
        if (body.transactionId) transactionId = body.transactionId;
        if (body.transaction_id) transactionId = body.transaction_id;
        if (body.nsu) transactionId = body.nsu;
        if (body.invoice_slug) transactionId = body.invoice_slug;
        if (body.slug) transactionId = body.slug;
      } catch (_e) {
        // Body was not JSON or empty - ignore
      }
    }

    if (!token) {
      console.error("[activate-premium] Missing user access token.");
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Token missing" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Initialize Supabase Service Client
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 3. Authenticate User using Service Client
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !user) {
      console.error("[activate-premium] Auth verification failed:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[activate-premium] Authenticated user: ${user.email} (ID: ${user.id})`);

    // 4. Check if user is already premium
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    const alreadyPremium =
      profile?.is_premium &&
      (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date());

    if (alreadyPremium) {
      console.log(`[activate-premium] User ${user.email} is already premium.`);
      return new Response(JSON.stringify({ 
        success: true, 
        already_premium: true,
        expires_at: profile.premium_expires_at 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Look for unprocessed payments in the last 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    console.log(`[activate-premium] Searching unprocessed webhook_logs since ${cutoff} (filter key: ${transactionId || "None"})`);
    
    const { data: logs, error: logsError } = await serviceClient
      .from("webhook_logs")
      .select("id, payload, created_at")
      .eq("processed", false)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (logsError) {
      console.error("[activate-premium] Error querying webhook_logs:", logsError.message);
      return new Response(JSON.stringify({ success: false, error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!logs || logs.length === 0) {
      console.log(`[activate-premium] No unprocessed payments found in the last 48h for user ${user.email}`);
      return new Response(JSON.stringify({ success: false, no_payment: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Perform precise matching in Deno
    let matchedLog = null;

    if (transactionId) {
      const lowerTxId = String(transactionId).trim().toLowerCase();
      console.log(`[activate-premium] Attempting precise match for identifier: "${lowerTxId}"`);
      
      matchedLog = logs.find(log => {
        const payload = log.payload || {};
        const nsu = String(payload.transaction_nsu || "").trim().toLowerCase();
        const slug = String(payload.invoice_slug || "").trim().toLowerCase();
        const orderNsu = String(payload.order_nsu || "").trim().toLowerCase();
        const id = String(log.id || "").trim().toLowerCase();
        
        return nsu === lowerTxId || slug === lowerTxId || orderNsu === lowerTxId || id === lowerTxId;
      });

      if (matchedLog) {
        console.log(`[activate-premium] Precise match found! Log ID: ${matchedLog.id}`);
      } else {
        console.log(`[activate-premium] No precise match found for identifier: "${lowerTxId}".`);
      }
    }

    // Fallback: if no specific transactionId was requested or no match was found, use the latest unprocessed log
    if (!matchedLog) {
      console.log(`[activate-premium] Falling back to the most recent unprocessed payment log.`);
      matchedLog = logs[0];
    }

    const payload = matchedLog.payload || {};
    const finalTransactionNsu = payload.transaction_nsu || payload.invoice_slug || matchedLog.id;

    console.log(`[activate-premium] Activating premium using log ${matchedLog.id} (NSU: ${finalTransactionNsu})...`);

    // 7. Activate premium for 1 year
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({
        is_premium: true,
        premium_since: new Date().toISOString(),
        premium_expires_at: expiresAt.toISOString(),
        premium_transaction_nsu: finalTransactionNsu,
        premium_email: user.email,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[activate-premium] Failed to update profile:", updateError.message);
      return new Response(JSON.stringify({ success: false, error: "Update failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 8. Mark the webhook log as processed
    await serviceClient
      .from("webhook_logs")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        activated_user_id: user.id,
      })
      .eq("id", matchedLog.id);

    console.log(`[activate-premium] Premium successfully activated for user ${user.id} (${user.email})`);

    return new Response(
      JSON.stringify({ success: true, expires_at: expiresAt.toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[activate-premium] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
