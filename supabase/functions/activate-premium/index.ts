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

  // Initialize service role client early for logging
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const logToDatabase = async (mensagem: string, metadata: any = {}, userId: string | null = null, userEmail: string | null = null) => {
    try {
      console.log(`[activate-premium-log] ${mensagem}`, JSON.stringify(metadata));
      await serviceClient.from("error_logs").insert([{
        tipo: "activate_premium_log",
        mensagem: `[activate-premium] ${mensagem}`,
        metadata,
        user_id: userId,
        user_email: userEmail,
        pagina: "edge-function"
      }]);
    } catch (err) {
      console.error("Failed to log to database error_logs:", err);
    }
  };

  try {
    await logToDatabase("Method received", { method: req.method, url: req.url });
    
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

    // Try to parse JSON body
    if (req.method === "POST" || req.method === "PUT") {
      try {
        const body = await req.json();
        await logToDatabase("Parsed request body", { body });
        if (body.token) token = body.token;
        if (body.transactionId) transactionId = body.transactionId;
        if (body.transaction_id) transactionId = body.transaction_id;
        if (body.nsu) transactionId = body.nsu;
        if (body.invoice_slug) transactionId = body.invoice_slug;
        if (body.slug) transactionId = body.slug;
      } catch (e) {
        await logToDatabase("Body parsing failed or empty", { error: e.message });
      }
    }

    await logToDatabase("Parsed parameters", { 
      hasToken: !!token, 
      tokenPrefix: token ? token.substring(0, 15) + "..." : null,
      transactionId 
    });

    if (!token) {
      await logToDatabase("Missing user access token", { status: 401 });
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Token missing" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Authenticate User
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token);
    if (authError || !user) {
      await logToDatabase("Auth verification failed", { error: authError?.message || "User is null", tokenPrefix: token.substring(0, 15) + "..." });
      return new Response(JSON.stringify({ error: "Unauthorized", message: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await logToDatabase("User authenticated successfully", {}, user.id, user.email);

    // 4. Check if user is already premium
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("is_premium, premium_expires_at")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      await logToDatabase("Error fetching profile", { error: profileError.message }, user.id, user.email);
    }

    const currentlyPremium =
      profile?.is_premium &&
      (!profile.premium_expires_at || new Date(profile.premium_expires_at) > new Date());

    if (currentlyPremium) {
      await logToDatabase("User is already premium", { premium_expires_at: profile?.premium_expires_at }, user.id, user.email);
      return new Response(JSON.stringify({ 
        success: true, 
        already_premium: true,
        expires_at: profile?.premium_expires_at 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Look for unprocessed payments in the last 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    await logToDatabase("Searching unprocessed webhook_logs", { cutoff, filterTxId: transactionId }, user.id, user.email);
    
    const { data: logs, error: logsError } = await serviceClient
      .from("webhook_logs")
      .select("id, payload, created_at")
      .eq("processed", false)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false });

    if (logsError) {
      await logToDatabase("Error querying webhook_logs", { error: logsError.message }, user.id, user.email);
      return new Response(JSON.stringify({ success: false, error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!logs || logs.length === 0) {
      await logToDatabase("No unprocessed payments found in last 48h", { cutoff }, user.id, user.email);
      return new Response(JSON.stringify({ success: false, no_payment: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await logToDatabase("Unprocessed logs found", { count: logs.length, logIds: logs.map(l => l.id) }, user.id, user.email);

    // 6. Perform precise matching
    let matchedLog = null;

    if (transactionId) {
      const lowerTxId = String(transactionId).trim().toLowerCase();
      matchedLog = logs.find(log => {
        const payload = log.payload || {};
        const nsu = String(payload.transaction_nsu || "").trim().toLowerCase();
        const slug = String(payload.invoice_slug || "").trim().toLowerCase();
        const orderNsu = String(payload.order_nsu || "").trim().toLowerCase();
        const id = String(log.id || "").trim().toLowerCase();
        
        return nsu === lowerTxId || slug === lowerTxId || orderNsu === lowerTxId || id === lowerTxId;
      });

      if (matchedLog) {
        await logToDatabase("Precise match found", { matchedLogId: matchedLog.id, transactionId }, user.id, user.email);
      } else {
        await logToDatabase("No precise match found for transactionId, falling back to latest", { transactionId }, user.id, user.email);
      }
    }

    // Fallback: if no specific transactionId was requested or no match was found, use the latest unprocessed log
    if (!matchedLog) {
      matchedLog = logs[0];
      await logToDatabase("Using fallback latest unprocessed log", { matchedLogId: matchedLog.id }, user.id, user.email);
    }

    const payload = matchedLog.payload || {};
    const finalTransactionNsu = payload.transaction_nsu || payload.invoice_slug || matchedLog.id;

    await logToDatabase("Updating profile to premium", { matchedLogId: matchedLog.id, nsu: finalTransactionNsu }, user.id, user.email);

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
      await logToDatabase("Failed to update profile to premium", { error: updateError.message }, user.id, user.email);
      return new Response(JSON.stringify({ success: false, error: "Update failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 8. Mark the webhook log as processed
    const { error: logUpdateError } = await serviceClient
      .from("webhook_logs")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        activated_user_id: user.id,
      })
      .eq("id", matchedLog.id);

    if (logUpdateError) {
      await logToDatabase("Warning: failed to mark webhook log as processed", { error: logUpdateError.message, matchedLogId: matchedLog.id }, user.id, user.email);
    } else {
      await logToDatabase("Webhook log marked as processed successfully", { matchedLogId: matchedLog.id }, user.id, user.email);
    }

    await logToDatabase("Premium successfully activated!", { expiresAt: expiresAt.toISOString() }, user.id, user.email);

    return new Response(
      JSON.stringify({ success: true, expires_at: expiresAt.toISOString() }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    await logToDatabase("Unexpected execution error", { error: err.message, stack: err.stack });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
