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
  itens: Array<{
    nome: string;
    variacao: string;
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
    // Log only order number, no PII
    console.log("Admin notification for order:", data.numeroPedido);

    const formatPrice = (price: number) => price.toFixed(2).replace(".", ",");
    const isPix = data.metodoPagamento === "pix";

    const itensHtml = data.itens
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.nome} (${item.variacao})</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantidade}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">R$ ${formatPrice(item.preco * item.quantidade)}</td>
        </tr>
      `
      )
      .join("");

    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Novo Pedido Pendente - Elatho</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header - Amarelo para indicar PENDENTE -->
          <div style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">⏳ Novo Pedido PENDENTE</h1>
            <p style="color: #ffffff; margin: 8px 0 0 0; opacity: 0.9;">Aguardando confirmação de pagamento</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <div style="background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <h2 style="color: #92400e; margin: 0; font-size: 20px;">
                Pedido #${data.numeroPedido}
              </h2>
              <p style="color: #92400e; margin: 8px 0 0 0;">
                💰 <strong>R$ ${formatPrice(data.total)}</strong> via ${isPix ? "PIX" : "Cartão"}
              </p>
              <p style="color: #b45309; margin: 8px 0 0 0; font-size: 14px;">
                ⚠️ ${isPix ? "Aguardando comprovante PIX" : "Aguardando confirmação do Mercado Pago"}
              </p>
            </div>
            
            <!-- Cliente -->
            <h3 style="color: #1a1a1a; margin: 0 0 12px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">
              👤 Cliente
            </h3>
            <table style="width: 100%; margin-bottom: 24px;">
              <tr>
                <td style="padding: 6px 0; color: #6b7280; width: 100px;">Nome:</td>
                <td style="padding: 6px 0; font-weight: 600;">${data.clienteNome}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">Email:</td>
                <td style="padding: 6px 0;"><a href="mailto:${data.clienteEmail}" style="color: #7c3aed;">${data.clienteEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">WhatsApp:</td>
                <td style="padding: 6px 0;">
                  <a href="https://wa.me/55${data.clienteWhatsapp.replace(/\D/g, '')}" style="color: #16a34a; font-weight: 600;">
                    ${data.clienteWhatsapp}
                  </a>
                </td>
              </tr>
            </table>
            
            <!-- Endereço -->
            <h3 style="color: #1a1a1a; margin: 0 0 12px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">
              📍 Endereço
            </h3>
            <p style="color: #4a4a4a; line-height: 1.6; margin: 0 0 24px 0;">
              ${data.endereco.rua}, ${data.endereco.numero}${data.endereco.complemento ? `, ${data.endereco.complemento}` : ""}<br>
              ${data.endereco.bairro} - ${data.endereco.cidade}/${data.endereco.estado}<br>
              CEP: ${data.endereco.cep}
            </p>
            
            <!-- Itens -->
            <h3 style="color: #1a1a1a; margin: 0 0 12px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">
              📦 Itens
            </h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #fef3c7;">
                  <th style="padding: 8px; text-align: left;">Produto</th>
                  <th style="padding: 8px; text-align: center;">Qtd</th>
                  <th style="padding: 8px; text-align: right;">Valor</th>
                </tr>
              </thead>
              <tbody>
                ${itensHtml}
              </tbody>
            </table>
            
            <!-- CTA -->
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://wa.me/55${data.clienteWhatsapp.replace(/\D/g, '')}" 
                 style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 8px;">
                📱 WhatsApp
              </a>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #fef3c7; padding: 16px; text-align: center;">
            <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 600;">
              ⚠️ Este é apenas um aviso de pedido pendente. 
              O email de confirmação será enviado ao cliente após você confirmar o pagamento.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log("Sending admin notification");
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Elatho Semijoias <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `⏳ PENDENTE: Pedido #${data.numeroPedido} - R$ ${formatPrice(data.total)} (${isPix ? "PIX" : "Cartão"})`,
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
