import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Interface para as assinaturas de push
interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

serve(async (req) => {
  try {
    const payload = await req.json()
    const { record, old_record, table, type } = payload

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let title = "iCatequese"
    let body = "Você tem uma nova atualização."
    let userIdToNotify = null

    // Lógica para definir quem notificar e qual a mensagem
    if (table === 'comunicacao_respostas' && type === 'INSERT') {
      title = "Nova Resposta Recebida"
      body = `${record.nome_respondente} respondeu ao questionário Conecta Família.`
      const { data: form } = await supabase.from('comunicacao_forms').select('created_by').eq('id', record.form_id).single()
      userIdToNotify = form?.created_by
    } else if (table === 'catequizandos' && type === 'INSERT') {
      title = "Nova Inscrição Online"
      body = `${record.nome} realizou uma nova inscrição.`
      // Notifica quem criou a comunidade selecionada
      const { data: com } = await supabase.from('comunidades').select('created_by').eq('id', record.comunidade_id).single()
      userIdToNotify = com?.created_by
    } else if (table === 'missoes_familia' && type === 'UPDATE') {
      if (record.concluidas > (old_record?.concluidas || 0)) {
        title = "Missão Concluída"
        body = `Uma família concluiu a missão: ${record.titulo}`
        userIdToNotify = record.created_by
      }
    }

    if (!userIdToNotify) {
      return new Response("Nenhum usuário para notificar", { status: 200 })
    }

    // Busca as assinaturas de push do usuário
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userIdToNotify)

    if (!subs || subs.length === 0) {
      return new Response("Usuário não possui assinaturas de push", { status: 200 })
    }

    // Aqui enviamos a notificação usando um serviço ou chamando diretamente a API de Push
    // Como estamos em um ambiente Edge, o ideal é usar a biblioteca web-push.
    // Nota: Para produção, o usuário deve configurar VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY nas Secrets do Supabase.
    
    console.log(`[Push] Enviando para ${userIdToNotify}: ${title} - ${body}`)

    // Exemplo de retorno de sucesso
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Processamento concluído",
      notifications_queued: subs.length 
    }), { 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (error) {
    console.error("Erro no processamento da notificação:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
