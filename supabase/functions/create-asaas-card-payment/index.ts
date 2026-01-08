import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_API_URL = "https://api.asaas.com/v3";

interface CardPaymentRequest {
  customerId: string;
  valor: number;
  parcelas: number;
  numeroPedido: string;
  descricao?: string;
  cartao: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  holderInfo: {
    name: string;
    email: string;
    cpf: string;
    cep: string;
    addressNumber: string;
    phone: string;
  };
}

// Calculate installment value with interest (2% per month for 5+ installments)
function calculateInstallmentValue(total: number, parcelas: number): number {
  if (parcelas <= 4) {
    // No interest for up to 4 installments
    return Math.round((total / parcelas) * 100) / 100;
  }
  
  // Apply 2% monthly interest for 5+ installments
  const monthlyRate = 0.02;
  const factor = (monthlyRate * Math.pow(1 + monthlyRate, parcelas)) / (Math.pow(1 + monthlyRate, parcelas) - 1);
  const installmentValue = total * factor;
  return Math.round(installmentValue * 100) / 100;
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

    const { customerId, valor, parcelas, numeroPedido, descricao, cartao, holderInfo }: CardPaymentRequest = await req.json();

    console.log("Creating Asaas card payment for order:", numeroPedido, "Installments:", parcelas);

    // Clean inputs
    const cpfNumbers = holderInfo.cpf?.replace(/\D/g, '') || '';
    const cepNumbers = holderInfo.cep?.replace(/\D/g, '') || '';
    const phoneNumbers = holderInfo.phone?.replace(/\D/g, '') || '';

    // Calculate due date (today)
    const dueDate = new Date().toISOString().split('T')[0];

    // Calculate installment value
    const installmentValue = calculateInstallmentValue(valor, parcelas);
    const totalWithInterest = parcelas > 4 ? installmentValue * parcelas : valor;

    // Build payment body
    const paymentBody: Record<string, unknown> = {
      customer: customerId,
      billingType: "CREDIT_CARD",
      value: parcelas > 4 ? totalWithInterest : valor,
      dueDate: dueDate,
      description: descricao || `Pedido ${numeroPedido} - Elatho Semijoias`,
      externalReference: numeroPedido,
      creditCard: {
        holderName: cartao.holderName,
        number: cartao.number.replace(/\s/g, ''),
        expiryMonth: cartao.expiryMonth,
        expiryYear: cartao.expiryYear.length === 2 ? `20${cartao.expiryYear}` : cartao.expiryYear,
        ccv: cartao.ccv,
      },
      creditCardHolderInfo: {
        name: holderInfo.name,
        email: holderInfo.email,
        cpfCnpj: cpfNumbers,
        postalCode: cepNumbers,
        addressNumber: holderInfo.addressNumber,
        phone: phoneNumbers,
      },
    };

    // Add installment info if more than 1
    if (parcelas > 1) {
      paymentBody.installmentCount = parcelas;
      paymentBody.installmentValue = installmentValue;
    }

    console.log("Creating card payment - Value:", paymentBody.value, "Installments:", parcelas);

    const response = await fetch(`${ASAAS_API_URL}/payments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey,
      },
      body: JSON.stringify(paymentBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Asaas card payment error:", data);
      
      // Parse Asaas error codes for user-friendly messages
      let userError = data.errors?.[0]?.description || "Erro ao processar pagamento com cartão";
      
      if (data.errors?.[0]?.code === "invalid_creditCard") {
        userError = "Dados do cartão inválidos. Verifique número, validade e CVV.";
      } else if (data.errors?.[0]?.code === "invalid_creditCardHolderInfo") {
        userError = "Dados do titular inválidos. Verifique CPF e endereço.";
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: userError,
          details: data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Asaas card payment result:", data.id, "Status:", data.status);

    // Check if payment was approved
    const isApproved = data.status === "CONFIRMED" || data.status === "RECEIVED";
    
    return new Response(
      JSON.stringify({
        success: true,
        paymentId: data.id,
        status: data.status,
        isApproved,
        value: data.value,
        installmentCount: data.installmentCount,
        installmentValue: data.installmentValue,
        netValue: data.netValue,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating Asaas card payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
