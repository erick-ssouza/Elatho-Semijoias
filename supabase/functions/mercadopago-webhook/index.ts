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
        .update({ status: body.status, payment_status: body.status })
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

    console.log("Webhook type:", type, "Action:", action, "Data ID:", data?.id);

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
        const errorText = await mpResponse.text();
        console.error("Failed to fetch payment from MP:", errorText);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const payment = await mpResponse.json();
      console.log("Payment details - Status:", payment.status, "External Ref:", payment.external_reference);

      // Try to find order by external_reference OR by payment_id
      let numeroPedido = payment.external_reference;
      
      // If no external_reference, try to find by payment_id
      if (!numeroPedido) {
        console.log("No external_reference, searching by payment_id:", paymentId);
        const { data: pedidoByPaymentId } = await supabase
          .from("pedidos")
          .select("numero_pedido")
          .eq("payment_id", String(paymentId))
          .maybeSingle();
        
        if (pedidoByPaymentId) {
          numeroPedido = pedidoByPaymentId.numero_pedido;
          console.log("Found order by payment_id:", numeroPedido);
        }
      }

      if (!numeroPedido) {
        console.log("Could not find order for payment:", paymentId);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Map Mercado Pago status to our order status
      // Valid statuses: pendente, confirmado, enviado, entregue, cancelado
      let novoStatus: string | null = null;
      let paymentStatus: string = payment.status;
      
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
        console.log(`Updating order ${numeroPedido} to status: ${novoStatus}, payment_status: ${paymentStatus}`);

        // Update order status in database
        const { data: pedido, error } = await supabase
          .from("pedidos")
          .update({ 
            status: novoStatus,
            payment_status: paymentStatus,
            payment_id: String(paymentId),
          })
          .eq("numero_pedido", numeroPedido)
          .select()
          .single();

        if (error) {
          console.error("Error updating order:", error);
        } else {
          console.log("Order updated successfully:", pedido?.numero_pedido, "-> Status:", novoStatus);

          // Decrementar estoque quando pagamento for aprovado
          if (novoStatus === "confirmado" && pedido?.itens) {
            console.log("Updating stock for confirmed order");
            try {
              const itens = pedido.itens as Array<{ id: string; quantidade: number }>;
              
              for (const item of itens) {
                // Buscar estoque atual
                const { data: produto, error: fetchError } = await supabase
                  .from("produtos")
                  .select("estoque")
                  .eq("id", item.id)
                  .single();

                if (fetchError) {
                  console.error(`Error fetching product ${item.id}:`, fetchError);
                  continue;
                }

                const estoqueAtual = produto?.estoque ?? 0;
                const novoEstoque = Math.max(0, estoqueAtual - item.quantidade);

                const { error: updateError } = await supabase
                  .from("produtos")
                  .update({ estoque: novoEstoque })
                  .eq("id", item.id);

                if (updateError) {
                  console.error(`Error updating stock for product ${item.id}:`, updateError);
                } else {
                  console.log(`Stock updated for product ${item.id}: ${estoqueAtual} -> ${novoEstoque}`);
                }
              }
            } catch (stockError) {
              console.error("Error updating stock:", stockError);
            }
          }

          // Send email notification if payment confirmed
          if (novoStatus === "confirmado" && pedido?.cliente_email) {
            try {
              console.log("Sending confirmation email to:", pedido.cliente_email);
              await supabase.functions.invoke("send-status-update-email", {
                body: {
                  to: pedido.cliente_email,
                  customerName: pedido.cliente_nome,
                  orderNumber: pedido.numero_pedido,
                  newStatus: "confirmado",
                },
              });
              console.log("Status update email sent successfully");
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
