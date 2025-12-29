import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");

    if (!accessToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not configured");
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // Check if this is a test/simulation request
    if (body.test === true && body.numeroPedido && body.status) {
      console.log("Test mode: simulating payment update");
      
      const { data: pedido, error } = await supabase
        .from("pedidos")
        .update({ status: body.status })
        .eq("numero_pedido", body.numeroPedido)
        .select()
        .single();

      if (error) {
        console.error("Error updating order:", error);
        return new Response(
          JSON.stringify({ received: true, error: error.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Test order updated:", pedido);
      return new Response(
        JSON.stringify({ received: true, updated: true, pedido }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mercado Pago sends different types of notifications
    const { type, data, action } = body;

    // We're interested in payment notifications
    if (type === "payment" || action?.includes("payment")) {
      const paymentId = data?.id;

      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Fetching payment details for ID:", paymentId);

      // Get payment details from Mercado Pago
      const mpResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!mpResponse.ok) {
        console.error("Failed to fetch payment from MP:", await mpResponse.text());
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payment = await mpResponse.json();
      console.log("Payment details:", JSON.stringify(payment));

      // Extract order number from external_reference
      const numeroPedido = payment.external_reference;

      if (!numeroPedido) {
        console.log("No external_reference (order number) in payment");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Map Mercado Pago status to our order status
      // Valid statuses: pendente, confirmado, enviado, entregue, cancelado
      let novoStatus: string | null = null;
      
      switch (payment.status) {
        case "approved":
          novoStatus = "confirmado"; // Payment confirmed
          break;
        case "pending":
        case "in_process":
          novoStatus = "pendente";
          break;
        case "rejected":
        case "cancelled":
          novoStatus = "cancelado";
          break;
        default:
          console.log("Unknown payment status:", payment.status);
      }

      if (novoStatus) {
        console.log(`Updating order ${numeroPedido} to status: ${novoStatus}`);

        // Update order status in database
        const { data: pedido, error } = await supabase
          .from("pedidos")
          .update({ status: novoStatus })
          .eq("numero_pedido", numeroPedido)
          .select()
          .single();

        if (error) {
          console.error("Error updating order:", error);
        } else {
          console.log("Order updated successfully:", pedido);

          // Send email notification if payment confirmed
          if (novoStatus === "confirmado" && pedido?.cliente_email) {
            try {
              await supabase.functions.invoke("send-status-update-email", {
                body: {
                  to: pedido.cliente_email,
                  customerName: pedido.cliente_nome,
                  orderNumber: pedido.numero_pedido,
                  newStatus: "confirmado",
                },
              });
              console.log("Status update email sent");
            } catch (emailError) {
              console.error("Error sending email:", emailError);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Always return 200 to Mercado Pago to avoid retries
    return new Response(JSON.stringify({ received: true, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});