import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

// HMAC-SHA256 signature verification for Mercado Pago webhooks
async function verifySignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): Promise<boolean> {
  if (!xSignature || !xRequestId) {
    console.error("Missing x-signature or x-request-id header");
    return false;
  }

  // Parse x-signature header (format: ts=xxx,v1=xxx)
  const parts: Record<string, string> = {};
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      parts[key.trim()] = value.trim();
    }
  });

  const ts = parts["ts"];
  const v1 = parts["v1"];

  if (!ts || !v1) {
    console.error("Invalid x-signature format");
    return false;
  }

  // Build the manifest string as per Mercado Pago documentation
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

  // Generate HMAC-SHA256 signature
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(manifest));
  const computedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const isValid = computedHash === v1;
  if (!isValid) {
    console.error("Signature verification failed");
    console.log("Expected:", v1);
    console.log("Computed:", computedHash);
  }

  return isValid;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET");

    if (!accessToken) {
      console.error("MERCADO_PAGO_ACCESS_TOKEN not configured");
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    // Mercado Pago sends different types of notifications
    const { type, data, action } = body;

    console.log("Processing webhook - Type:", type, "Data ID:", data?.id);

    // We're interested in payment notifications
    if (type === "payment" || action?.includes("payment")) {
      const paymentId = data?.id;

      if (!paymentId) {
        console.log("No payment ID in webhook");
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify webhook signature if secret is configured
      if (webhookSecret) {
        const xSignature = req.headers.get("x-signature");
        const xRequestId = req.headers.get("x-request-id");

        const isValidSignature = await verifySignature(
          xSignature,
          xRequestId,
          String(paymentId),
          webhookSecret
        );

        if (!isValidSignature) {
          console.error("Invalid webhook signature - rejecting request");
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log("Webhook signature verified successfully");
      } else {
        console.warn("MERCADO_PAGO_WEBHOOK_SECRET not configured - signature verification skipped");
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

          // Send notifications if payment confirmed
          if (novoStatus === "confirmado") {
            // 1. Send confirmation email to customer
            if (pedido?.cliente_email) {
              try {
                console.log(
                  "Sending customer confirmation email for order:",
                  pedido.numero_pedido,
                  "->",
                  pedido.cliente_email
                );

                const { data: confirmData, error: confirmError } = await supabase.functions.invoke(
                  "send-payment-confirmed-email",
                  {
                    body: { pedidoId: pedido.id },
                  }
                );

                if (confirmError) {
                  console.error("send-payment-confirmed-email returned error:", confirmError);
                  console.error("send-payment-confirmed-email response data:", confirmData);
                } else {
                  console.log("Customer confirmation email sent successfully:", confirmData);
                }
              } catch (emailError) {
                console.error("Error sending customer email (invoke threw):", emailError);
              }
            } else {
              console.warn("Skipping customer confirmation email: pedido.cliente_email is empty");
            }

            // 2. Send admin notification email
            try {
              console.log("Sending admin email notification for order:", pedido.numero_pedido);
              const itens = pedido.itens as Array<{
                nome: string;
                variacao?: string;
                quantidade: number;
                preco: number;
              }>;
              const endereco = pedido.endereco as {
                rua: string;
                numero: string;
                complemento?: string;
                bairro: string;
                cidade: string;
                estado: string;
                cep: string;
              };

              const { data: adminInvokeData, error: adminInvokeError } = await supabase.functions.invoke(
                "send-admin-notification",
                {
                  body: {
                    numeroPedido: pedido.numero_pedido,
                    clienteNome: pedido.cliente_nome,
                    clienteEmail: pedido.cliente_email,
                    clienteWhatsapp: pedido.cliente_whatsapp,
                    metodoPagamento: pedido.metodo_pagamento || "pix",
                    total: pedido.total,
                    subtotal: pedido.subtotal,
                    frete: pedido.frete,
                    itens,
                    endereco,
                  },
                }
              );

              if (adminInvokeError) {
                console.error("send-admin-notification returned error:", adminInvokeError);
                console.error("send-admin-notification response data:", adminInvokeData);
              } else {
                console.log("Admin notification email sent successfully:", adminInvokeData);
              }
            } catch (adminEmailError) {
              console.error("Error sending admin email (invoke threw):", adminEmailError);
            }

            // 3. Send Telegram notification
            try {
              console.log("Sending Telegram notification for order:", pedido.numero_pedido);
              const itens = pedido.itens as Array<{ nome: string; variacao?: string; quantidade: number }>;
              const endereco = pedido.endereco as {
                rua: string;
                numero: string;
                complemento?: string;
                bairro: string;
                cidade: string;
                estado: string;
                cep: string;
              };

              const { data: telegramInvokeData, error: telegramInvokeError } = await supabase.functions.invoke(
                "send-telegram-notification",
                {
                  body: {
                    numeroPedido: pedido.numero_pedido,
                    clienteNome: pedido.cliente_nome,
                    clienteWhatsapp: pedido.cliente_whatsapp,
                    total: pedido.total,
                    metodoPagamento: pedido.metodo_pagamento || "pix",
                    itens,
                    endereco,
                  },
                }
              );

              if (telegramInvokeError) {
                console.error("send-telegram-notification returned error:", telegramInvokeError);
                console.error("send-telegram-notification response data:", telegramInvokeData);
              } else {
                console.log("Telegram notification sent successfully:", telegramInvokeData);
              }
            } catch (telegramError) {
              console.error("Error sending Telegram notification (invoke threw):", telegramError);
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
