import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_API_URL = "https://api.asaas.com/v3";

interface PaymentStatusRequest {
  paymentId: string;
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

    const { paymentId }: PaymentStatusRequest = await req.json();

    if (!paymentId) {
      return new Response(
        JSON.stringify({ success: false, error: "paymentId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching Asaas payment status for:", paymentId);

    const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      headers: {
        "access_token": apiKey,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Asaas payment status error:", data);
      return new Response(
        JSON.stringify({
          success: false,
          error: data.errors?.[0]?.description || "Erro ao consultar status",
          details: data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Asaas payment status:", data.status);

    // Map Asaas status to our internal status
    let internalStatus: string;
    let isConfirmed = false;

    switch (data.status) {
      case "CONFIRMED":
      case "RECEIVED":
      case "RECEIVED_IN_CASH":
        internalStatus = "approved";
        isConfirmed = true;
        break;
      case "PENDING":
      case "AWAITING_RISK_ANALYSIS":
        internalStatus = "pending";
        break;
      case "OVERDUE":
        internalStatus = "overdue";
        break;
      case "REFUNDED":
      case "REFUND_REQUESTED":
        internalStatus = "refunded";
        break;
      case "CHARGEBACK_REQUESTED":
      case "CHARGEBACK_DISPUTE":
      case "AWAITING_CHARGEBACK_REVERSAL":
        internalStatus = "chargeback";
        break;
      case "DUNNING_REQUESTED":
      case "DUNNING_RECEIVED":
        internalStatus = "dunning";
        break;
      default:
        internalStatus = data.status.toLowerCase();
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentId: data.id,
        status: data.status,
        internalStatus,
        isConfirmed,
        value: data.value,
        billingType: data.billingType,
        externalReference: data.externalReference,
        confirmedDate: data.confirmedDate,
        paymentDate: data.paymentDate,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error fetching Asaas payment status:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
