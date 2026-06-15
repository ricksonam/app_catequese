import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Trata a requisição OPTIONS (CORS preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, protocolo, tipo, mensagem, nome } = await req.json();

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY não configurada. E-mail não será enviado.");
      return new Response(
        JSON.stringify({ message: "Key do Resend não configurada, mas request chegou." }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "iCatequese <no-reply@icatequese.com.br>", // Altere caso tenha um domínio validado no Resend
        to: [email],
        subject: `Confirmação de Atendimento: ${protocolo}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #0f172a;">Olá${nome ? " " + nome : ""}!</h2>
            <p>Recebemos a sua solicitação de <strong>${tipo}</strong>.</p>
            <p>O número do seu protocolo é: <strong>${protocolo}</strong></p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p><strong>Detalhes da solicitação:</strong></p>
            <p style="background: #f8fafc; padding: 15px; border-radius: 8px; color: #334155;">
              ${mensagem}
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #64748b; font-size: 14px;">Nossa equipe de atendimento já foi notificada e entrará em contato se necessário.</p>
            <br/>
            <p>Atenciosamente,<br/><strong>Equipe iCatequese</strong></p>
          </div>
        `,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else {
      const error = await res.text();
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
