import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_API_URL = "https://api.asaas.com/v3";

interface CustomerRequest {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
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

    const { nome, email, telefone, cpf }: CustomerRequest = await req.json();

    console.log("Creating Asaas customer for:", email);

    // Clean phone and CPF
    const phoneNumbers = telefone?.replace(/\D/g, '') || '';
    const cpfNumbers = cpf?.replace(/\D/g, '') || '';

    // First, check if customer already exists
    const searchResponse = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cpfNumbers}`, {
      headers: {
        "access_token": apiKey,
      },
    });

    const searchData = await searchResponse.json();
    
    if (searchData.data && searchData.data.length > 0) {
      const existingCustomer = searchData.data[0];
      console.log("Customer already exists:", existingCustomer.id);
      return new Response(
        JSON.stringify({
          success: true,
          customerId: existingCustomer.id,
          isExisting: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new customer
    const customerBody = {
      name: nome,
      email: email,
      phone: phoneNumbers,
      cpfCnpj: cpfNumbers,
      notificationDisabled: true, // Disable Asaas notifications
    };

    const response = await fetch(`${ASAAS_API_URL}/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access_token": apiKey,
      },
      body: JSON.stringify(customerBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Asaas customer creation error:", data);
      return new Response(
        JSON.stringify({
          success: false,
          error: data.errors?.[0]?.description || "Erro ao criar cliente no Asaas",
          details: data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Asaas customer created:", data.id);

    return new Response(
      JSON.stringify({
        success: true,
        customerId: data.id,
        isExisting: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating Asaas customer:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
