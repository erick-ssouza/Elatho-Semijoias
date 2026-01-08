import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_API_URL = "https://api.asaas.com/v3";

interface PixPaymentRequest {
  customerId: string;
  valor: number;
  numeroPedido: string;
  descricao?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ASAAS_API_KEY");
    if (!apiKey) {
      throw new Error("ASAAS_API_KEY not configured");
    }

    const { customerId, valor, numeroPedido, descricao }: PixPaymentRequest = await req.json();

    console.log("Creating Asaas PIX payment for order:", numeroPedido);

    // Calculate due date (today + 1 day for PIX expiration)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // Create PIX payment
    const paymentBody = {
      customer: customerId,
      billingType: "PIX",
      value: valor,
      dueDate: dueDateStr,
      description: descricao || `Pedido ${numeroPedido} - Elatho Semijoias`,
      externalReference: numeroPedido,
    };

    console.log("Creating payment with body:", JSON.stringify(paymentBody));

    const response = await fetch(`${ASAAS_API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey,
      },
      body: JSON.stringify(paymentBody),
    });

    const paymentData = await response.json();

    if (!response.ok) {
      console.error("Asaas payment creation error:", paymentData);
      return new Response(
        JSON.stringify({
          success: false,
          error: paymentData.errors?.[0]?.description || "Erro ao criar pagamento PIX",
          details: paymentData,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Asaas payment created:", paymentData.id);

    // Now fetch the PIX QR Code
    const qrResponse = await fetch(`${ASAAS_API_URL}/payments/${paymentData.id}/pixQrCode`, {
      headers: {
        "access_token": apiKey,
      },
    });

    const qrData = await qrResponse.json();

    if (!qrResponse.ok) {
      console.error("Asaas QR code fetch error:", qrData);
      // Payment was created but QR code failed - still return payment info
      return new Response(
        JSON.stringify({
          success: true,
          paymentId: paymentData.id,
          status: paymentData.status,
          value: paymentData.value,
          dueDate: paymentData.dueDate,
          qrCodeError: true,
          error: "QR Code não disponível",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("PIX QR Code fetched successfully");

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: paymentData.id,
        status: paymentData.status,
        value: paymentData.value,
        dueDate: paymentData.dueDate,
        qrCodeBase64: qrData.encodedImage,
        pixCopiaECola: qrData.payload,
        expirationDate: qrData.expirationDate,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating Asaas PIX payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
