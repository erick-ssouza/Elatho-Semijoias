import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] get-order-status called`);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { numeroPedido } = await req.json();

    if (!numeroPedido) {
      console.log(`[${timestamp}] Missing numeroPedido`);
      return new Response(
        JSON.stringify({ error: "numeroPedido is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${timestamp}] Fetching status for order: ${numeroPedido}`);

    // Use service role to bypass RLS - this is safe because we only expose status info
    const { data, error } = await supabase
      .from("pedidos")
      .select("id, numero_pedido, status, payment_status")
      .eq("numero_pedido", numeroPedido)
      .maybeSingle();

    if (error) {
      console.error(`[${timestamp}] Database error:`, error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch order status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      console.log(`[${timestamp}] Order not found: ${numeroPedido}`);
      return new Response(
        JSON.stringify({ error: "Order not found", found: false }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[${timestamp}] Order found - status: ${data.status}, payment_status: ${data.payment_status}`);

    return new Response(
      JSON.stringify({
        found: true,
        id: data.id,
        numeroPedido: data.numero_pedido,
        status: data.status,
        paymentStatus: data.payment_status,
        timestamp,
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        } 
      }
    );
  } catch (error: unknown) {
    console.error(`[${timestamp}] Error:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
