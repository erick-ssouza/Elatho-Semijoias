import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  numeroPedido: string;
  clienteNome: string;
  clienteEmail: string;
  clienteWhatsapp: string;
  endereco: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  itens: Array<{
    nome: string;
    variacao: string;
    quantidade: number;
    preco: number;
  }>;
  subtotal: number;
  desconto?: number;
  cupom?: string;
  frete: number;
  total: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderEmailRequest = await req.json();
    console.log("Order data received:", orderData.numeroPedido);

    const formatPrice = (price: number) => price.toFixed(2).replace(".", ",");

    const itensHtml = orderData.itens
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            ${item.nome} (${item.variacao})
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

    const descontoHtml = orderData.desconto
      ? `<tr>
          <td colspan="2" style="padding: 8px 12px; text-align: right; color: #16a34a;">Desconto${orderData.cupom ? ` (${orderData.cupom})` : ""}:</td>
          <td style="padding: 8px 12px; text-align: right; color: #16a34a;">-R$ ${formatPrice(orderData.desconto)}</td>
        </tr>`
      : "";

    // Email para o cliente
    const clienteEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido Confirmado - Elatho</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e4bc 100%); padding: 32px; text-align: center;">
            <h1 style="color: #1a1a1a; margin: 0; font-size: 28px;">✨ Elatho Semijoias</h1>
            <p style="color: #4a4a4a; margin: 8px 0 0 0;">Pedido Confirmado!</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0;">Olá, ${orderData.clienteNome}!</h2>
            <p style="color: #4a4a4a; line-height: 1.6;">
              Seu pedido <strong>#${orderData.numeroPedido}</strong> foi recebido com sucesso! 
              Agradecemos a preferência. 💛
            </p>
            
            <!-- Itens -->
            <h3 style="color: #1a1a1a; margin: 24px 0 12px 0; border-bottom: 2px solid #d4af37; padding-bottom: 8px;">
              📦 Itens do Pedido
            </h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f9fafb;">
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
                  <td style="padding: 8px 12px; text-align: right;">R$ ${formatPrice(orderData.subtotal)}</td>
                </tr>
                ${descontoHtml}
                <tr>
                  <td colspan="2" style="padding: 8px 12px; text-align: right;">Frete:</td>
                  <td style="padding: 8px 12px; text-align: right;">${orderData.frete === 0 ? "Grátis" : `R$ ${formatPrice(orderData.frete)}`}</td>
                </tr>
                <tr style="background-color: #d4af37;">
                  <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; color: #1a1a1a;">Total:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #1a1a1a;">R$ ${formatPrice(orderData.total)}</td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Endereço -->
            <h3 style="color: #1a1a1a; margin: 24px 0 12px 0; border-bottom: 2px solid #d4af37; padding-bottom: 8px;">
              📍 Endereço de Entrega
            </h3>
            <p style="color: #4a4a4a; line-height: 1.8; margin: 0;">
              ${orderData.endereco.rua}, ${orderData.endereco.numero}${orderData.endereco.complemento ? `, ${orderData.endereco.complemento}` : ""}<br>
              ${orderData.endereco.bairro}<br>
              ${orderData.endereco.cidade} - ${orderData.endereco.estado}<br>
              CEP: ${orderData.endereco.cep}
            </p>
            
            <!-- Pagamento -->
            <div style="background-color: #fef3c7; border-radius: 12px; padding: 20px; margin-top: 24px;">
              <h3 style="color: #92400e; margin: 0 0 8px 0;">💳 Próximos Passos</h3>
              <p style="color: #92400e; margin: 0; line-height: 1.6;">
                Você receberá as instruções de pagamento via WhatsApp. 
                Após a confirmação do pagamento, seu pedido será preparado e enviado!
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Dúvidas? Entre em contato pelo WhatsApp ou responda este email.
            </p>
            <p style="color: #9ca3af; margin: 12px 0 0 0; font-size: 12px;">
              © 2024 Elatho Semijoias. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email para o cliente
    console.log("Sending email to customer:", orderData.clienteEmail);
    const { data: customerEmailData, error: customerEmailError } = await resend.emails.send({
      from: "Elatho Semijoias <onboarding@resend.dev>",
      to: [orderData.clienteEmail],
      subject: `✨ Pedido #${orderData.numeroPedido} Confirmado - Elatho Semijoias`,
      html: clienteEmailHtml,
    });

    if (customerEmailError) {
      console.error("Error sending customer email:", customerEmailError);
      throw customerEmailError;
    }

    console.log("Customer email sent successfully:", customerEmailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email enviado com sucesso",
        emailId: customerEmailData?.id 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
