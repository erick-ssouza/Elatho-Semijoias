import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramNotificationRequest {
  numeroPedido: string;
  clienteNome: string;
  clienteWhatsapp: string | null;
  total: number;
  metodoPagamento: string;
  itens: Array<{
    nome: string;
    variacao?: string | null;
    quantidade: number;
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!botToken || !chatId) {
      console.error("Telegram credentials not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Telegram not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: TelegramNotificationRequest = await req.json();
    console.log("Sending Telegram notification for order:", body.numeroPedido);

    // Format items list
    const itensFormatted = body.itens
      .map((item) => {
        const variacao = item.variacao ? ` (${item.variacao})` : "";
        return `• ${item.nome}${variacao} - Qtd: ${item.quantidade}`;
      })
      .join("\n");

    // Format address
    const endereco = body.endereco;
    const enderecoFormatted = [
      `${endereco.rua}, ${endereco.numero}`,
      endereco.complemento || null,
      `${endereco.bairro}`,
      `${endereco.cidade} - ${endereco.estado}`,
      `CEP: ${endereco.cep}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Format payment method
    const pagamento = body.metodoPagamento === "pix" ? "PIX" : "Cartão";

    // Format total
    const totalFormatted = body.total.toFixed(2).replace(".", ",");

    // Build message
    const message = `🛍️ <b>NOVO PEDIDO PAGO!</b>

<b>Pedido:</b> #${body.numeroPedido}
<b>Cliente:</b> ${body.clienteNome}
<b>WhatsApp:</b> ${body.clienteWhatsapp || "Não informado"}
<b>Valor:</b> R$ ${totalFormatted}
<b>Pagamento:</b> ${pagamento}

<b>Itens:</b>
${itensFormatted}

<b>Entrega:</b>
${enderecoFormatted}`;

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });

    const telegramResult = await telegramResponse.json();

    if (!telegramResponse.ok) {
      console.error("Telegram API error:", telegramResult);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send Telegram message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Telegram notification sent successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
