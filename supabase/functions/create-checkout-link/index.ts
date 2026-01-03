import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  numeroPedido: string;
  clienteNome: string;
  clienteEmail: string;
  total: number;
  itens: Array<{
    nome: string;
    quantidade: number;
    preco: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const siteUrl = Deno.env.get("SITE_URL") || "https://eyvcrvqpxlldxyrfwjpn.lovableproject.com";
    
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const { numeroPedido, clienteNome, clienteEmail, total, itens }: CheckoutRequest = await req.json();

    console.log("Creating checkout for order:", numeroPedido);

    // Validate required fields
    if (!numeroPedido || !clienteEmail || !total) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Mercado Pago preference for checkout
    const items = itens && itens.length > 0 
      ? itens.map(item => ({
          title: item.nome,
          quantity: item.quantidade,
          unit_price: item.preco,
          currency_id: "BRL",
        }))
      : [{
          title: `Pedido ${numeroPedido} - Elatho Semijoias`,
          quantity: 1,
          unit_price: total,
          currency_id: "BRL",
        }];

    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items,
        payer: {
          name: clienteNome,
          email: clienteEmail,
        },
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [
            { id: "ticket" }, // Exclude boleto
          ],
          installments: 10, // Até 10x
        },
        back_urls: {
          success: `${siteUrl}/pedido-confirmado?numero=${numeroPedido}&from=mp&status=success`,
          failure: `${siteUrl}/checkout?step=review&return=mp&status=failure&numero=${numeroPedido}`,
          pending: `${siteUrl}/pedido-confirmado?numero=${numeroPedido}&from=mp&status=pending`,
        },
        auto_return: "approved",
        external_reference: numeroPedido,
        statement_descriptor: "ELATHO JOIAS",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago error:", data);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create checkout", 
          details: data.message || "Unknown error" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Checkout created successfully:", data.id);

    return new Response(
      JSON.stringify({
        success: true,
        checkoutUrl: data.init_point,
        preferenceId: data.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});