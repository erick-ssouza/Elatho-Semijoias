import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentConfirmedRequest {
  pedidoId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-payment-confirmed-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pedidoId }: PaymentConfirmedRequest = await req.json();
    console.log("Sending payment confirmation for pedido:", pedidoId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Buscar dados do pedido
    const { data: pedido, error: pedidoError } = await supabase
      .from("pedidos")
      .select("*")
      .eq("id", pedidoId)
      .single();

    if (pedidoError || !pedido) {
      console.error("Pedido not found:", pedidoError);
      throw new Error("Pedido não encontrado");
    }

    if (!pedido.cliente_email) {
      console.log("No email for this customer, skipping");
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No customer email" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const formatPrice = (price: number) => price.toFixed(2).replace(".", ",");
    const itens = pedido.itens as Array<{ nome: string; variacao?: string | null; quantidade: number; preco: number }>;
    const endereco = pedido.endereco as { rua: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string; cep: string };

    const itensHtml = itens
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">
            ${item.nome}${item.variacao ? ` (${item.variacao})` : ""}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">
            ${item.quantidade}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">
            R$ ${formatPrice(item.preco * item.quantidade)}
          </td>
        </tr>
      `
      )
      .join("");

    const clienteEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido Confirmado - Elatho</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background-color: #059669; padding: 24px 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">✅ Pedido Confirmado</h1>
            <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 14px;">Elatho Semijoias</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <p style="color: #374151; margin: 0 0 16px 0; font-size: 15px; line-height: 1.6;">
              Olá, <strong>${pedido.cliente_nome}</strong>!
            </p>
            <p style="color: #374151; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6;">
              Seu pedido <strong>#${pedido.numero_pedido}</strong> foi confirmado e está sendo preparado com carinho. 
              Você receberá o código de rastreio assim que for enviado.
            </p>
            
            <!-- Itens -->
            <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Itens do Pedido
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Produto</th>
                  <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Qtd</th>
                  <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${itensHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 8px 12px; text-align: right; color: #6b7280; font-size: 14px;">Subtotal:</td>
                  <td style="padding: 8px 12px; text-align: right; color: #374151; font-size: 14px;">R$ ${formatPrice(pedido.subtotal)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 12px; text-align: right; color: #6b7280; font-size: 14px;">Frete:</td>
                  <td style="padding: 8px 12px; text-align: right; color: #374151; font-size: 14px;">${pedido.frete === 0 ? "Grátis" : `R$ ${formatPrice(pedido.frete)}`}</td>
                </tr>
                <tr style="background-color: #059669;">
                  <td colspan="2" style="padding: 14px 12px; text-align: right; font-weight: 600; color: #ffffff; font-size: 14px;">Total:</td>
                  <td style="padding: 14px 12px; text-align: right; font-weight: 700; font-size: 16px; color: #ffffff;">R$ ${formatPrice(pedido.total)}</td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Endereço -->
            ${endereco ? `
            <h3 style="color: #111827; margin: 24px 0 12px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Endereço de Entrega
            </h3>
            <p style="color: #374151; line-height: 1.6; margin: 0; font-size: 14px; background-color: #f9fafb; padding: 16px; border-radius: 8px;">
              ${endereco.rua}, ${endereco.numero}${endereco.complemento ? `, ${endereco.complemento}` : ""}<br>
              ${endereco.bairro}<br>
              ${endereco.cidade} - ${endereco.estado}<br>
              CEP: ${endereco.cep}
            </p>
            ` : ""}
            
            <!-- Info -->
            <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-top: 24px; border: 1px solid #bbf7d0;">
              <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.6;">
                📦 Estamos preparando seu pedido<br>
                📧 Você receberá o código de rastreio por email
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 13px;">
              Dúvidas? Responda este email ou entre em contato pelo WhatsApp.
            </p>
            <p style="color: #9ca3af; margin: 12px 0 0 0; font-size: 12px;">
              © ${new Date().getFullYear()} Elatho Semijoias
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending confirmation email for order:", pedido.numero_pedido);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Elatho Semijoias <onboarding@resend.dev>",
      to: [pedido.cliente_email],
      subject: `✅ Pedido Confirmado - Elatho Semijoias`,
      html: clienteEmailHtml,
    });

    if (emailError) {
      console.error("Error sending confirmation email:", emailError);
      throw emailError;
    }

    console.log("Confirmation email sent:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-payment-confirmed-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
