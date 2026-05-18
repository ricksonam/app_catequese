import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log(`[activate-premium] Called with method: ${req.method}`);
    
    // Authenticate the user via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      console.error("[activate-premium] Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if user is already premium
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
      return new Response(JSON.stringify({ success: true, already_premium: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look for an unprocessed payment in the last 48 hours
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    console.log(`[activate-premium] Searching for unprocessed webhook_logs since ${cutoff} for user ${user.email}`);
    
    const { data: logs, error: logsError } = await serviceClient
      .from("webhook_logs")
      .select("id, payload, created_at")
      .eq("processed", false)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1);

    if (logsError) {
      console.error("[activate-premium] Error querying webhook_logs:", logsError.message);
      return new Response(JSON.stringify({ success: false, error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!logs || logs.length === 0) {
      console.log(`[activate-premium] No unprocessed payment found for user ${user.id} (${user.email})`);
      return new Response(JSON.stringify({ success: false, no_payment: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const log = logs[0];
    const transactionNsu = log.payload?.transaction_nsu || log.payload?.invoice_slug || log.id;

    console.log(`[activate-premium] Found unprocessed log ${log.id}. Activating premium...`);

    // Activate premium for 1 year
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { error: updateError } = await serviceClient
      .from("profiles")
      .update({
        is_premium: true,
        premium_since: new Date().toISOString(),
        premium_expires_at: expiresAt.toISOString(),
        premium_transaction_nsu: transactionNsu,
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

    // Mark the webhook log as processed to prevent double activation
    await serviceClient
      .from("webhook_logs")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        activated_user_id: user.id,
      })
      .eq("id", log.id);

    console.log(`[activate-premium] Premium activated for user ${user.id} (${user.email}) via log ${log.id}`);

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
