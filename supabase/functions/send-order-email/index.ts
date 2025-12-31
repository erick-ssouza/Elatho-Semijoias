import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin email - change this to your admin email
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@elatho.com";

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
  adminEmail?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-order-email function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const orderData: OrderEmailRequest = await req.json();
    // Log only order number, no PII
    console.log("Order email for:", orderData.numeroPedido);

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
    console.log("Sending customer email for order:", orderData.numeroPedido);
    const { data: customerEmailData, error: customerEmailError } = await resend.emails.send({
      from: "Elatho Semijoias <onboarding@resend.dev>",
      to: [orderData.clienteEmail],
      subject: `✨ Pedido #${orderData.numeroPedido} Confirmado - Elatho Semijoias`,
      html: clienteEmailHtml,
    });

    if (customerEmailError) {
      console.error("Error sending customer email:", customerEmailError);
    } else {
      console.log("Customer email sent successfully:", customerEmailData);
    }

    // Email para o admin
    const adminEmailAddress = orderData.adminEmail || ADMIN_EMAIL;
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Novo Pedido - Elatho</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🛒 Novo Pedido!</h1>
            <p style="color: #e9d5ff; margin: 8px 0 0 0;">Pedido #${orderData.numeroPedido}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <h2 style="color: #166534; margin: 0; font-size: 20px;">💰 Total: R$ ${formatPrice(orderData.total)}</h2>
            </div>
            
            <!-- Cliente -->
            <h3 style="color: #1a1a1a; margin: 0 0 12px 0; border-bottom: 2px solid #7c3aed; padding-bottom: 8px;">
              👤 Dados do Cliente
            </h3>
            <table style="width: 100%; margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 120px;">Nome:</td>
                <td style="padding: 8px 0; font-weight: 600;">${orderData.clienteNome}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${orderData.clienteEmail}" style="color: #7c3aed;">${orderData.clienteEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">WhatsApp:</td>
                <td style="padding: 8px 0;"><a href="https://wa.me/55${orderData.clienteWhatsapp.replace(/\D/g, '')}" style="color: #16a34a; font-weight: 600;">${orderData.clienteWhatsapp}</a></td>
              </tr>
            </table>
            
            <!-- Endereço -->
            <h3 style="color: #1a1a1a; margin: 0 0 12px 0; border-bottom: 2px solid #7c3aed; padding-bottom: 8px;">
              📍 Endereço de Entrega
            </h3>
            <p style="color: #4a4a4a; line-height: 1.8; margin: 0 0 24px 0;">
              ${orderData.endereco.rua}, ${orderData.endereco.numero}${orderData.endereco.complemento ? `, ${orderData.endereco.complemento}` : ""}<br>
              ${orderData.endereco.bairro}<br>
              ${orderData.endereco.cidade} - ${orderData.endereco.estado}<br>
              CEP: ${orderData.endereco.cep}
            </p>
            
            <!-- Itens -->
            <h3 style="color: #1a1a1a; margin: 0 0 12px 0; border-bottom: 2px solid #7c3aed; padding-bottom: 8px;">
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
                <tr style="background-color: #7c3aed;">
                  <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; color: #ffffff;">Total:</td>
                  <td style="padding: 12px; text-align: right; font-weight: bold; font-size: 18px; color: #ffffff;">R$ ${formatPrice(orderData.total)}</td>
                </tr>
              </tfoot>
            </table>
            
            <!-- CTA -->
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://wa.me/55${orderData.clienteWhatsapp.replace(/\D/g, '')}" 
                 style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                📱 Contatar Cliente no WhatsApp
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              Este email foi enviado automaticamente pelo sistema Elatho Semijoias.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email para o admin
    console.log("Sending admin email for order:", orderData.numeroPedido);
    const { data: adminEmailData, error: adminEmailError } = await resend.emails.send({
      from: "Elatho Semijoias <onboarding@resend.dev>",
      to: [adminEmailAddress],
      subject: `🛒 Novo Pedido #${orderData.numeroPedido} - R$ ${formatPrice(orderData.total)}`,
      html: adminEmailHtml,
    });

    if (adminEmailError) {
      console.error("Error sending admin email:", adminEmailError);
    } else {
      console.log("Admin email sent successfully:", adminEmailData);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Emails enviados com sucesso",
        customerEmailId: customerEmailData?.id,
        adminEmailId: adminEmailData?.id,
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
