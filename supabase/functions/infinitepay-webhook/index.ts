import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extrai o order_nsu de qualquer lugar do payload (busca recursiva)
function extractOrderNsu(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;
  
  // Campos comuns onde a InfinitePay pode devolver o NSU
  const nsuFields = ['order_nsu', 'order_id', 'nsu', 'reference', 'external_reference', 'metadata_order_nsu'];
  for (const field of nsuFields) {
    if (obj[field] && typeof obj[field] === 'string' && obj[field].trim()) {
      return obj[field].trim();
    }
  }
  
  // Busca recursiva em sub-objetos
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      const found = extractOrderNsu(obj[key]);
      if (found) return found;
    }
  }
  return null;
}

// Extrai e-mail de qualquer lugar do payload (fallback)
function extractEmailFromPayload(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.email && typeof obj.email === 'string' && obj.email.includes('@')) return obj.email;
  if (obj.customer_email && typeof obj.customer_email === 'string') return obj.customer_email;
  
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const found = extractEmailFromPayload(obj[key]);
      if (found) return found;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const payloadText = await req.text();
    let payload: any;
    try {
      payload = JSON.parse(payloadText);
    } catch (e) {
      payload = { raw: payloadText };
    }

    console.log("[InfinitePay Webhook] Payload recebido:", JSON.stringify(payload));

    // Salvar log bruto para auditoria
    await supabaseAdmin.from("error_logs").insert({
      tipo: "WEBHOOK_INFINITEPAY",
      mensagem: "Postback recebido da InfinitePay",
      metadata: JSON.stringify(payload),
    });

    // Verificar se é pagamento aprovado
    const statusStr = JSON.stringify(payload).toLowerCase();
    const isApproved = 
      statusStr.includes("approved") || 
      statusStr.includes("paid") || 
      statusStr.includes("pago") ||
      statusStr.includes("aprovado");

    if (!isApproved) {
      console.log("[InfinitePay Webhook] Status não aprovado. Ignorando.");
      return new Response(JSON.stringify({ received: true, ignored: "Not approved status" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === ESTRATÉGIA 1: Rastrear por Order NSU ===
    const orderNsu = extractOrderNsu(payload);
    const amount = payload.amount ? payload.amount / 100 : 9.90;

    console.log("[InfinitePay Webhook] Order NSU encontrado:", orderNsu);

    if (orderNsu) {
      // Buscar o pedido pelo NSU para ver se existe
      const { data: order, error: orderError } = await supabaseAdmin
        .from("payment_orders")
        .select("id, user_id, status, user_email")
        .eq("order_nsu", orderNsu)
        .maybeSingle();

      if (orderError) {
        console.error("[InfinitePay Webhook] Erro ao buscar order:", orderError);
      } else if (order) {
        if (order.status === 'paid') {
          console.log(`[InfinitePay Webhook] Order ${orderNsu} já processado. Ignorando duplicata.`);
          return new Response(JSON.stringify({ received: true, ignored: "Already processed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Atualizar o pedido existente como pago
        await supabaseAdmin
          .from("payment_orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            webhook_payload: payload,
          })
          .eq("order_nsu", orderNsu);

        if (order.user_id) {
          console.log(`[InfinitePay Webhook] Ativando premium para user_id: ${order.user_id}`);
          // Ativar premium no perfil do usuário
          const expiresAt = new Date();
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);

          await supabaseAdmin
            .from("profiles")
            .update({
              is_premium: true,
              premium_since: new Date().toISOString(),
              premium_expires_at: expiresAt.toISOString(),
              premium_email: order.user_email,
              premium_set_by: "webhook",
              premium_transaction_nsu: orderNsu,
            })
            .eq("id", order.user_id);
          
          return new Response(JSON.stringify({ success: true, method: "order_nsu_matched" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          console.log(`[InfinitePay Webhook] Order ${orderNsu} atualizado como paid, mas sem user_id. Aguardando Vínculo Tardio.`);
          return new Response(JSON.stringify({ success: true, method: "order_nsu_orphan_updated" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        // Pedido não existe! Vamos CRIAR o registro como PAGO e sem user_id (Vínculo Tardio)
        console.warn(`[InfinitePay Webhook] Order NSU "${orderNsu}" não encontrado na tabela. Criando pedido órfão.`);
        
        await supabaseAdmin.from("payment_orders").insert({
          order_nsu: orderNsu,
          status: "paid",
          amount: amount,
          user_id: null, // Vínculo tardio
          paid_at: new Date().toISOString(),
          webhook_payload: payload,
        });

        return new Response(JSON.stringify({ success: true, method: "order_nsu_orphan_created" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // === ESTRATÉGIA 2: Fallback por e-mail (compatibilidade retroativa) ===
    const email = extractEmailFromPayload(payload);
    console.log(`[InfinitePay Webhook] Tentando fallback por e-mail: ${email}`);

    if (!email) {
      console.error("[InfinitePay Webhook] ❌ Não foi possível identificar o pagador e sem NSU gerado.");
      await supabaseAdmin.from("error_logs").insert({
        tipo: "WEBHOOK_UNIDENTIFIED",
        mensagem: "Pagamento aprovado mas sem NSU ou e-mail para identificar o usuário",
        metadata: JSON.stringify(payload),
      });
      return new Response(JSON.stringify({ 
        error: "Cannot identify payer: no order_nsu or email in payload"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ativar premium por e-mail
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const { data: profile, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        is_premium: true,
        premium_since: new Date().toISOString(),
        premium_expires_at: expiresAt.toISOString(),
        premium_email: email,
        premium_set_by: "webhook",
      })
      .eq("email", email.toLowerCase())
      .select("id")
      .single();

    if (updateError) {
      console.error("[InfinitePay Webhook] Erro ao atualizar por e-mail:", updateError);
      return new Response(JSON.stringify({ error: "Error updating profile by email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[InfinitePay Webhook] ✅ Premium ativado por e-mail! Profile: ${profile?.id}`);
    return new Response(JSON.stringify({ 
      success: true, 
      method: "email_fallback",
      profile_id: profile?.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[InfinitePay Webhook] Erro fatal:", error);
    await supabaseAdmin.from("error_logs").insert({
      tipo: "WEBHOOK_FATAL_ERROR",
      mensagem: error.message || "Erro desconhecido",
    });
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
