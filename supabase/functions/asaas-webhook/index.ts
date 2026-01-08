import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, asaas-access-token",
};

interface AsaasWebhookPayload {
  event: string;
  payment?: {
    id: string;
    status: string;
    value: number;
    billingType: string;
    externalReference: string;
    customer: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: AsaasWebhookPayload = await req.json();

    console.log("Asaas webhook received:", payload.event);

    // Only process payment events
    if (!payload.payment) {
      console.log("No payment data in webhook, ignoring");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { payment } = payload;
    const numeroPedido = payment.externalReference;

    console.log(`Processing webhook for order ${numeroPedido}, event: ${payload.event}, status: ${payment.status}`);

    // Map Asaas status to our status
    let newStatus: string | null = null;
    let paymentStatus: string | null = null;

    switch (payload.event) {
      case "PAYMENT_CONFIRMED":
      case "PAYMENT_RECEIVED":
        newStatus = "pago";
        paymentStatus = "approved";
        break;
      case "PAYMENT_OVERDUE":
        paymentStatus = "overdue";
        break;
      case "PAYMENT_DELETED":
      case "PAYMENT_REFUNDED":
        paymentStatus = "refunded";
        break;
      case "PAYMENT_AWAITING_RISK_ANALYSIS":
        paymentStatus = "in_process";
        break;
      case "PAYMENT_REPROVED_BY_RISK_ANALYSIS":
        paymentStatus = "rejected";
        break;
      default:
        console.log("Unhandled event type:", payload.event);
    }

    if (!paymentStatus) {
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch current order
    const { data: pedido, error: fetchError } = await supabase
      .from("pedidos")
      .select("*")
      .eq("numero_pedido", numeroPedido)
      .maybeSingle();

    if (fetchError || !pedido) {
      console.error("Order not found:", numeroPedido, fetchError);
      return new Response(
        JSON.stringify({ received: true, error: "Order not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Avoid reprocessing already confirmed orders
    if (pedido.status === "pago" || pedido.status === "enviado" || pedido.status === "entregue") {
      console.log("Order already processed, skipping:", numeroPedido);
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order status
    const updateData: Record<string, unknown> = {
      payment_status: paymentStatus,
      payment_id: payment.id,
    };

    if (newStatus) {
      updateData.status = newStatus;
    }

    const { error: updateError } = await supabase
      .from("pedidos")
      .update(updateData)
      .eq("numero_pedido", numeroPedido);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    console.log(`Order ${numeroPedido} updated: status=${newStatus || 'unchanged'}, payment_status=${paymentStatus}`);

    // If payment confirmed, decrement stock and send notifications
    if (paymentStatus === "approved") {
      // Decrement stock
      const itens = pedido.itens as Array<{ produto_id?: string; quantidade: number }>;
      for (const item of itens) {
        if (item.produto_id) {
          const { error: stockError } = await supabase.rpc("decrement_stock", {
            p_produto_id: item.produto_id,
            p_quantidade: item.quantidade,
          });
          if (stockError) {
            console.error("Error decrementing stock:", stockError);
          }
        }
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-payment-confirmed-email", {
          body: { pedidoId: pedido.id },
        });
        console.log("Confirmation email sent");
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
      }

      // Send admin notification
      try {
        await supabase.functions.invoke("send-admin-notification", {
          body: {
            numeroPedido,
            clienteNome: pedido.cliente_nome,
            clienteEmail: pedido.cliente_email,
            total: pedido.total,
            metodoPagamento: pedido.metodo_pagamento,
          },
        });
        console.log("Admin notification sent");
      } catch (notifyError) {
        console.error("Error sending admin notification:", notifyError);
      }

      // Send Telegram notification
      try {
        const endereco = pedido.endereco as Record<string, string> | null;
        await supabase.functions.invoke("send-telegram-notification", {
          body: {
            numeroPedido,
            clienteNome: pedido.cliente_nome,
            clienteEmail: pedido.cliente_email,
            clienteWhatsapp: pedido.cliente_whatsapp,
            itens: pedido.itens,
            subtotal: pedido.subtotal,
            frete: pedido.frete,
            total: pedido.total,
            metodoPagamento: pedido.metodo_pagamento,
            endereco,
          },
        });
        console.log("Telegram notification sent");
      } catch (telegramError) {
        console.error("Error sending Telegram notification:", telegramError);
      }
    }

    return new Response(
      JSON.stringify({ received: true, success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error processing Asaas webhook:", error);
    // Always return 200 to prevent Asaas from retrying
    return new Response(
      JSON.stringify({ received: true, error: String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
