import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateOrderRequest {
  numeroPedido: string;
  cliente: {
    nome: string;
    email: string;
    whatsapp?: string;
    cpf?: string;
  };
  endereco: {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  itens: Array<{
    produto_id?: string;
    nome: string;
    variacao?: string | null;
    quantidade: number;
    preco: number;
  }>;
  subtotal: number;
  frete: number;
  total: number;
  cupomCodigo?: string;
  metodoPagamento?: string;
  paymentId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = (await req.json()) as CreateOrderRequest;

    const numeroPedido = body?.numeroPedido?.trim();
    const clienteNome = body?.cliente?.nome?.trim();
    const clienteEmail = body?.cliente?.email?.trim();

    if (!numeroPedido || !clienteNome || !clienteEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Dados do pedido incompletos." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(body.itens) || body.itens.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Carrinho vazio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1) Criar/atualizar cliente
    const { error: clienteError } = await supabase
      .from("clientes")
      .upsert(
        {
          nome: clienteNome,
          email: clienteEmail,
          whatsapp: body?.cliente?.whatsapp || null,
          cpf: body?.cliente?.cpf || null,
        },
        { onConflict: "email" }
      );

    if (clienteError) {
      console.error("Cliente upsert error:", clienteError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao salvar dados do cliente." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2) Criar pedido
    const { error: pedidoError } = await supabase.from("pedidos").insert({
      numero_pedido: numeroPedido,
      cliente_nome: clienteNome,
      cliente_email: clienteEmail,
      cliente_whatsapp: body?.cliente?.whatsapp || null,
      cliente_cpf: body?.cliente?.cpf || null,
      endereco: body.endereco,
      itens: body.itens,
      subtotal: Number(body.subtotal || 0),
      frete: Number(body.frete || 0),
      total: Number(body.total || 0),
      status: "pendente",
      metodo_pagamento: body?.metodoPagamento || "pix",
      payment_id: body?.paymentId || null,
    });

    if (pedidoError) {
      console.error("Pedido insert error:", pedidoError);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao registrar pedido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3) Incrementar uso do cupom (se houver)
    const cupomCodigo = body?.cupomCodigo?.trim();
    if (cupomCodigo) {
      const { data: cupom, error: cupomSelectError } = await supabase
        .from("cupons")
        .select("id, uso_atual")
        .eq("codigo", cupomCodigo.toUpperCase())
        .maybeSingle();

      if (!cupomSelectError && cupom?.id) {
        const usoAtual = Number(cupom.uso_atual || 0);
        const { error: cupomUpdateError } = await supabase
          .from("cupons")
          .update({ uso_atual: usoAtual + 1 })
          .eq("id", cupom.id);

        if (cupomUpdateError) {
          console.error("Cupom update error:", cupomUpdateError);
        }
      } else if (cupomSelectError) {
        console.error("Cupom select error:", cupomSelectError);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating order:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
