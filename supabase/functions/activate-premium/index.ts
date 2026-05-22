import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// activate-premium foi substituída pela função infinitepay-webhook
// Esta função retorna erro informativo para qualquer chamada
Deno.serve(async (_req: Request) => {
  return new Response(
    JSON.stringify({
      error: "deprecated",
      message: "Esta função foi substituída. O premium agora é ativado automaticamente via webhook da InfinitePay.",
    }),
    {
      status: 410,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
});
