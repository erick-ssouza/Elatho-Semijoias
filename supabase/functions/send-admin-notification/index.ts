import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@elatho.com";

interface AdminNotificationRequest {
  numeroPedido: string;
  clienteNome: string;
  clienteEmail: string;
  clienteWhatsapp: string;
  metodoPagamento: string;
  total: number;
  subtotal?: number;
  frete?: number;
  itens: Array<{
    nome: string;
    variacao?: string | null;
    quantidade: number;
    preco: number;
  }>;
  endereco: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-admin-notification function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: AdminNotificationRequest = await req.json();
    console.log("Admin notification for PAID order:", data.numeroPedido);

    const formatPrice = (price: number) => price.toFixed(2).replace(".", ",");
    const isPix = data.metodoPagamento === "pix";

    const itensHtml = data.itens
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">${item.nome}${item.variacao ? ` (${item.variacao})` : ""}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #374151;">${item.quantidade}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">R$ ${formatPrice(item.preco * item.quantidade)}</td>
        </tr>
      `
      )
      .join("");

    const subtotalValue = data.subtotal ?? data.total;
    const freteValue = data.frete ?? 0;

    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido Pago - Elatho</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          
          <!-- Header - Verde para PAGO -->
          <div style="background-color: #059669; padding: 24px 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">✅ Novo Pedido Pago</h1>
            <p style="color: #d1fae5; margin: 8px 0 0 0; font-size: 14px;">Pedido #${data.numeroPedido}</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            
            <!-- Resumo -->
            <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
              <p style="margin: 0; color: #166534; font-size: 18px; font-weight: 600;">
                💰 Total: R$ ${formatPrice(data.total)}
              </p>
              <p style="margin: 4px 0 0 0; color: #166534; font-size: 14px;">
                Pagamento via ${isPix ? "PIX" : "Cartão"} confirmado
              </p>
            </div>
            
            <!-- Cliente -->
            <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Cliente
            </h3>
            <table style="width: 100%; margin-bottom: 24px;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 100px; font-size: 14px;">Nome:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 500; font-size: 14px;">${data.clienteNome}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email:</td>
                <td style="padding: 8px 0; font-size: 14px;"><a href="mailto:${data.clienteEmail}" style="color: #2563eb; text-decoration: none;">${data.clienteEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">WhatsApp:</td>
                <td style="padding: 8px 0; font-size: 14px;">
                  <a href="https://wa.me/55${data.clienteWhatsapp?.replace(/\D/g, '') || ''}" style="color: #059669; font-weight: 500; text-decoration: none;">
                    ${data.clienteWhatsapp || "Não informado"}
                  </a>
                </td>
              </tr>
            </table>
            
            <!-- Endereço -->
            <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Endereço de Entrega
            </h3>
            <p style="color: #374151; line-height: 1.6; margin: 0 0 24px 0; font-size: 14px;">
              ${data.endereco.rua}, ${data.endereco.numero}${data.endereco.complemento ? `, ${data.endereco.complemento}` : ""}<br>
              ${data.endereco.bairro} - ${data.endereco.cidade}/${data.endereco.estado}<br>
              CEP: ${data.endereco.cep}
            </p>
            
            <!-- Itens -->
            <h3 style="color: #111827; margin: 0 0 12px 0; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
              Itens do Pedido
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
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
                  <td style="padding: 8px 12px; text-align: right; color: #374151; font-size: 14px;">R$ ${formatPrice(subtotalValue)}</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 8px 12px; text-align: right; color: #6b7280; font-size: 14px;">Frete:</td>
                  <td style="padding: 8px 12px; text-align: right; color: #374151; font-size: 14px;">${freteValue === 0 ? "Grátis" : `R$ ${formatPrice(freteValue)}`}</td>
                </tr>
                <tr style="background-color: #059669;">
                  <td colspan="2" style="padding: 14px 12px; text-align: right; font-weight: 600; color: #ffffff; font-size: 14px;">Total Pago:</td>
                  <td style="padding: 14px 12px; text-align: right; font-weight: 700; font-size: 16px; color: #ffffff;">R$ ${formatPrice(data.total)}</td>
                </tr>
              </tfoot>
            </table>
            
            <!-- CTA -->
            <div style="text-align: center; margin-top: 24px;">
              <a href="https://wa.me/55${data.clienteWhatsapp?.replace(/\D/g, '') || ''}" 
                 style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                📱 Contatar Cliente
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 12px;">
              Elatho Semijoias - Pedido Pago
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending admin notification for PAID order");
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Elatho Semijoias <pedidos@elathosemijoias.com.br>",
      to: [ADMIN_EMAIL],
      subject: `✅ Pedido Pago #${data.numeroPedido} - R$ ${formatPrice(data.total)}`,
      html: adminEmailHtml,
    });

    if (emailError) {
      console.error("Error sending admin notification:", emailError);
      throw emailError;
    }

    console.log("Admin notification sent:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-admin-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
