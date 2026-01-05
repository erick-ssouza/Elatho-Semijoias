import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusUpdateRequest {
  numeroPedido: string;
  clienteNome: string;
  clienteEmail: string;
  novoStatus: string;
  statusAnterior: string;
  codigoRastreio?: string | null;
}

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const statusEmojis: Record<string, string> = {
  pendente: "⏳",
  confirmado: "✅",
  enviado: "📦",
  entregue: "🎉",
  cancelado: "❌",
};

const statusColors: Record<string, { bg: string; text: string; accent: string }> = {
  pendente: { bg: "#fef3c7", text: "#92400e", accent: "#f59e0b" },
  confirmado: { bg: "#dbeafe", text: "#1e40af", accent: "#3b82f6" },
  enviado: { bg: "#e9d5ff", text: "#6b21a8", accent: "#8b5cf6" },
  entregue: { bg: "#d1fae5", text: "#065f46", accent: "#10b981" },
  cancelado: { bg: "#fee2e2", text: "#991b1b", accent: "#ef4444" },
};

const getStatusMessage = (status: string, codigoRastreio?: string | null): string => {
  const messages: Record<string, string> = {
    pendente: "Seu pedido está aguardando confirmação de pagamento.",
    confirmado: "Seu pagamento foi confirmado! Estamos preparando seu pedido com muito carinho.",
    enviado: codigoRastreio 
      ? `Seu pedido foi enviado! Use o código <strong>${codigoRastreio}</strong> para rastrear.`
      : "Seu pedido foi enviado! Em breve você receberá em casa.",
    entregue: "Seu pedido foi entregue! Esperamos que você ame suas novas semijoias. 💛",
    cancelado: "Seu pedido foi cancelado. Se tiver dúvidas, entre em contato conosco.",
  };
  return messages[status] || "O status do seu pedido foi atualizado.";
};

const handler = async (req: Request): Promise<Response> => {
  console.log("send-status-update-email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: StatusUpdateRequest = await req.json();
    // Log only order number and status, no PII
    console.log("Status update for order:", data.numeroPedido, "->", data.novoStatus);

    const { numeroPedido, clienteNome, clienteEmail, novoStatus, codigoRastreio } = data;

    if (!clienteEmail) {
      console.log("No customer email provided, skipping email notification");
      return new Response(
        JSON.stringify({ success: true, message: "No email to send to" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const colors = statusColors[novoStatus] || statusColors.pendente;
    const emoji = statusEmojis[novoStatus] || "📋";
    const statusLabel = statusLabels[novoStatus] || novoStatus;
    const message = getStatusMessage(novoStatus, codigoRastreio);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Atualização do Pedido - Elatho</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #d4af37 0%, #f4e4bc 100%); padding: 32px; text-align: center;">
            <h1 style="color: #1a1a1a; margin: 0; font-size: 28px;">✨ Elatho Semijoias</h1>
            <p style="color: #4a4a4a; margin: 8px 0 0 0;">Atualização do seu pedido</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 32px;">
            <h2 style="color: #1a1a1a; margin: 0 0 16px 0;">Olá, ${clienteNome}!</h2>
            
            <p style="color: #4a4a4a; line-height: 1.6; margin-bottom: 24px;">
              O status do seu pedido <strong>#${numeroPedido}</strong> foi atualizado.
            </p>
            
            <!-- Status Badge -->
            <div style="background-color: ${colors.bg}; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <div style="font-size: 48px; margin-bottom: 12px;">${emoji}</div>
              <h3 style="color: ${colors.text}; margin: 0; font-size: 24px; font-weight: 700;">
                ${statusLabel}
              </h3>
              <p style="color: ${colors.text}; margin: 12px 0 0 0; line-height: 1.6;">
                ${message}
              </p>
            </div>
            
            <!-- Timeline -->
            <div style="margin: 24px 0;">
              <h4 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 16px;">Acompanhamento do Pedido</h4>
              <div style="display: flex; align-items: center; gap: 8px;">
                ${["pendente", "confirmado", "enviado", "entregue"].map((status, index) => {
                  const isActive = ["pendente", "confirmado", "enviado", "entregue"].indexOf(novoStatus) >= index;
                  const isCurrent = status === novoStatus;
                  const color = isActive ? statusColors[status].accent : "#d1d5db";
                  return `
                    <div style="flex: 1; text-align: center;">
                      <div style="width: 24px; height: 24px; border-radius: 50%; background-color: ${color}; margin: 0 auto 4px; display: flex; align-items: center; justify-content: center;">
                        ${isActive ? '<span style="color: white; font-size: 12px;">✓</span>' : ''}
                      </div>
                      <span style="font-size: 10px; color: ${isCurrent ? colors.text : '#9ca3af'}; font-weight: ${isCurrent ? '600' : '400'};">
                        ${statusLabels[status]}
                      </span>
                    </div>
                    ${index < 3 ? `<div style="flex: 0.5; height: 2px; background-color: ${isActive && index < ["pendente", "confirmado", "enviado", "entregue"].indexOf(novoStatus) ? statusColors[status].accent : '#d1d5db'};"></div>` : ''}
                  `;
                }).join('')}
              </div>
            </div>
            
            ${novoStatus === 'enviado' && codigoRastreio ? `
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 16px; margin-top: 24px;">
                <h4 style="color: #0369a1; margin: 0 0 8px 0; font-size: 14px;">📦 Rastrear Pedido</h4>
                <p style="color: #0369a1; margin: 0; font-size: 18px; font-weight: 700; font-family: monospace;">
                  ${codigoRastreio}
                </p>
                <a href="https://www.linkcorreios.com.br/?id=${codigoRastreio}" 
                   target="_blank" 
                   style="display: inline-block; margin-top: 12px; background-color: #0369a1; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Rastrear nos Correios
                </a>
              </div>
            ` : ''}
            
            ${novoStatus === 'cancelado' ? `
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin-top: 24px;">
                <p style="color: #991b1b; margin: 0; line-height: 1.6;">
                  Se você não solicitou este cancelamento ou tem alguma dúvida, por favor entre em contato conosco.
                </p>
              </div>
            ` : ''}
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

    console.log("Sending status update email for order:", numeroPedido);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Elatho Semijoias <pedidos@elathosemijoias.com.br>",
      to: [clienteEmail],
      subject: `${emoji} Pedido #${numeroPedido} - ${statusLabel}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending status update email:", emailError);
      throw emailError;
    }

    console.log("Status update email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-status-update-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
