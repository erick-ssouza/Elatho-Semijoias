import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  numeroPedido: string;
  clienteNome: string;
  clienteEmail: string;
  clienteCpf: string;
  total: number;
  descricao: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const { numeroPedido, clienteNome, clienteEmail, clienteCpf, total, descricao }: PaymentRequest = await req.json();

    // Validate required fields
    if (!numeroPedido || !clienteNome || !clienteEmail || !total) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean CPF (remove formatting)
    const cpfNumbers = clienteCpf?.replace(/\D/g, '') || '';

    // Create PIX payment via Mercado Pago API
    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": `${numeroPedido}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: total,
        description: descricao || `Pedido ${numeroPedido} - Elatho Semijoias`,
        payment_method_id: "pix",
        payer: {
          email: clienteEmail,
          first_name: clienteNome.split(' ')[0],
          last_name: clienteNome.split(' ').slice(1).join(' ') || clienteNome.split(' ')[0],
          identification: cpfNumbers ? {
            type: "CPF",
            number: cpfNumbers,
          } : undefined,
        },
        notification_url: undefined, // Can be configured for webhooks
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago error:", data);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create payment", 
          details: data.message || data.cause?.[0]?.description || "Unknown error" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract PIX data
    const pixData = data.point_of_interaction?.transaction_data;
    
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: data.id,
        status: data.status,
        qrCode: pixData?.qr_code,
        qrCodeBase64: pixData?.qr_code_base64,
        ticketUrl: pixData?.ticket_url,
        expirationDate: data.date_of_expiration,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating PIX payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});