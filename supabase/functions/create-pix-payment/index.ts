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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const { numeroPedido, clienteNome, clienteEmail, clienteCpf, total, descricao }: PaymentRequest = await req.json();

    console.log("Creating PIX payment for order:", numeroPedido, "Total:", total);

    // Validate required fields
    if (!numeroPedido || !clienteNome || !clienteEmail || !total) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean CPF (remove formatting)
    const cpfNumbers = clienteCpf?.replace(/\D/g, '') || '';

    // Build webhook notification URL
    const webhookUrl = supabaseUrl 
      ? `${supabaseUrl}/functions/v1/mercadopago-webhook`
      : undefined;

    console.log("Webhook URL configured:", webhookUrl);

    // Create PIX payment via Mercado Pago API
    const paymentBody = {
      transaction_amount: total,
      description: descricao || `Pedido ${numeroPedido} - Elatho Semijoias`,
      payment_method_id: "pix",
      external_reference: numeroPedido, // IMPORTANTE: usado pelo webhook para identificar o pedido
      payer: {
        email: clienteEmail,
        first_name: clienteNome.split(' ')[0],
        last_name: clienteNome.split(' ').slice(1).join(' ') || clienteNome.split(' ')[0],
        identification: cpfNumbers ? {
          type: "CPF",
          number: cpfNumbers,
        } : undefined,
      },
      notification_url: webhookUrl, // URL do webhook para receber notificações
    };

    console.log("Payment request body:", JSON.stringify(paymentBody));

    const response = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-Idempotency-Key": `${numeroPedido}-${Date.now()}`,
      },
      body: JSON.stringify(paymentBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Mercado Pago error:", JSON.stringify(data));
      // Return 200 with success: false so frontend can handle gracefully (fallback to manual PIX)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Failed to create payment", 
          details: data.message || data.cause?.[0]?.description || "Unknown error" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("PIX payment created successfully. ID:", data.id, "Status:", data.status);

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
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
