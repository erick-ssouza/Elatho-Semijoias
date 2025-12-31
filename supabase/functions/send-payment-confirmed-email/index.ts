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
    const itens = pedido.itens as Array<{ nome: string; variacao: string; quantidade: number; preco: number }>;
    const endereco = pedido.endereco as { rua: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string; cep: string };

    const itensHtml = itens
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            ${item.nome} ${item.variacao ? `(${item.variacao})` : ""}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantidade}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
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
        <title>Pagamento Confirmado - Elatho</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header - Verde para CONFIRMADO -->
          <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✅ Pagamento Confirmado!</h1>
            <p style="color: #ffffff; margin: 8px 0 0 0; opacity: 0.9;">Seu pedido está sendo preparado</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0;">Olá, ${pedido.cliente_nome}!</h2>
            <p style="color: #4a4a4a; line-height: 1.6;">
              Ótimas notícias! O pagamento do seu pedido <strong>#${pedido.numero_pedido}</strong> foi confirmado! 🎉
            </p>
            <p style="color: #4a4a4a; line-height: 1.6;">
              Agora estamos preparando suas joias com muito carinho. Você receberá outro email assim que enviarmos.
            </p>
            
            <!-- Itens -->
            <h3 style="color: #1a1a1a; margin: 24px 0 12px 0; border-bottom: 2px solid #16a34a; padding-bottom: 8px;">
              📦 Seus Itens
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f0fdf4;">
                  <th style="padding: 12px; text-align: left; font-weight: 600;">Produto</th>
                  <th style="padding: 12px; text-align: center; font-weight: 600;">Qtd</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${itensHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 8px 12px; text-align: right;">Subtotal:</td>
                  <td style="padding: 8px 12px; text-align: right;">R$ ${formatPrice(pedido.subtotal)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 12px; text-align: right;">Frete:</td>
                  <td style="padding: 8px 12px; text-align: right;">${pedido.frete === 0 ? "Grátis" : `R$ ${formatPrice(pedido.frete)}`}</td>
                </tr>
                <tr style="background-color: #16a34a;">
                  <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; color: #ffffff;">Total Pago:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #ffffff;">R$ ${formatPrice(pedido.total)}</td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Endereço -->
            ${endereco ? `
            <h3 style="color: #1a1a1a; margin: 24px 0 12px 0; border-bottom: 2px solid #16a34a; padding-bottom: 8px;">
              📍 Endereço de Entrega
            </h3>
            <p style="color: #4a4a4a; line-height: 1.8; margin: 0;">
              ${endereco.rua}, ${endereco.numero}${endereco.complemento ? `, ${endereco.complemento}` : ""}<br>
              ${endereco.bairro}<br>
              ${endereco.cidade} - ${endereco.estado}<br>
              CEP: ${endereco.cep}
            </p>
            ` : ""}
            
            <!-- Próximos passos -->
            <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin-top: 24px;">
              <h3 style="color: #166534; margin: 0 0 8px 0;">📬 Próximos Passos</h3>
              <p style="color: #166534; margin: 0; line-height: 1.6;">
                1. Estamos preparando seu pedido com carinho<br>
                2. Você receberá o código de rastreio por email<br>
                3. Acompanhe a entrega pelos Correios
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Dúvidas? Responda este email ou entre em contato pelo WhatsApp.
            </p>
            <p style="color: #9ca3af; margin: 12px 0 0 0; font-size: 12px;">
              © 2024 Elatho Semijoias. Todos os direitos reservados.
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
      subject: `✅ Pagamento Confirmado - Pedido #${pedido.numero_pedido} - Elatho Semijoias`,
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
