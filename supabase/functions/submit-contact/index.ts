import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting: 3 submissions per IP per minute
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  
  record.count++;
  return false;
}

// Input validation
function validateInput(data: unknown): { valid: boolean; error?: string; sanitized?: { nome: string; email: string; assunto: string; mensagem: string } } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { nome, email, assunto, mensagem } = data as Record<string, unknown>;

  // Validate nome
  if (typeof nome !== 'string' || nome.trim().length < 3 || nome.trim().length > 100) {
    return { valid: false, error: 'Nome deve ter entre 3 e 100 caracteres' };
  }

  // Validate email
  if (typeof email !== 'string' || email.trim().length > 255) {
    return { valid: false, error: 'Email inválido' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Email inválido' };
  }

  // Validate assunto
  const validAssuntos = ['duvida', 'pedido', 'troca', 'parceria', 'elogio', 'outro'];
  if (typeof assunto !== 'string' || !validAssuntos.includes(assunto.trim())) {
    return { valid: false, error: 'Assunto inválido' };
  }

  // Validate mensagem
  if (typeof mensagem !== 'string' || mensagem.trim().length < 10 || mensagem.trim().length > 1000) {
    return { valid: false, error: 'Mensagem deve ter entre 10 e 1000 caracteres' };
  }

  return {
    valid: true,
    sanitized: {
      nome: nome.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 255),
      assunto: assunto.trim(),
      mensagem: mensagem.trim().slice(0, 1000),
    },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    if (isRateLimited(clientIP)) {
      console.log("Rate limit exceeded for contact form");
      return new Response(
        JSON.stringify({ success: false, error: "Muitas tentativas. Aguarde 1 minuto." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    
    // Validate input
    const validation = validateInput(body);
    if (!validation.valid || !validation.sanitized) {
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { nome, email, assunto, mensagem } = validation.sanitized;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert message using service role (bypasses RLS)
    const { error } = await supabase.from("mensagens").insert({
      nome,
      email,
      assunto,
      mensagem,
    });

    if (error) {
      console.error("Error inserting message:", error.code);
      return new Response(
        JSON.stringify({ success: false, error: "Erro ao enviar mensagem." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Contact form submitted successfully");

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
