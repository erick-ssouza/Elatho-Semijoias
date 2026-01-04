import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 3 testimonials per day per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
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

interface TestimonialInput {
  cliente_nome: string;
  texto: string;
  nota: number;
}

function validateInput(data: unknown): { valid: boolean; error?: string; sanitized?: TestimonialInput } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Dados inválidos' };
  }

  const input = data as Record<string, unknown>;

  // Validate cliente_nome
  if (!input.cliente_nome || typeof input.cliente_nome !== 'string') {
    return { valid: false, error: 'Nome é obrigatório' };
  }
  const nome = input.cliente_nome.trim();
  if (nome.length < 2 || nome.length > 100) {
    return { valid: false, error: 'Nome deve ter entre 2 e 100 caracteres' };
  }

  // Validate texto
  if (!input.texto || typeof input.texto !== 'string') {
    return { valid: false, error: 'Texto é obrigatório' };
  }
  const texto = input.texto.trim();
  if (texto.length < 10 || texto.length > 500) {
    return { valid: false, error: 'Texto deve ter entre 10 e 500 caracteres' };
  }

  // Validate nota
  if (typeof input.nota !== 'number' || input.nota < 1 || input.nota > 5) {
    return { valid: false, error: 'Nota deve ser entre 1 e 5' };
  }

  return {
    valid: true,
    sanitized: {
      cliente_nome: nome,
      texto,
      nota: Math.floor(input.nota),
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    
    if (isRateLimited(clientIp)) {
      console.log(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Muitas tentativas. Aguarde 24 horas.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const validation = validateInput(body);

    if (!validation.valid || !validation.sanitized) {
      console.log(`Validation failed: ${validation.error}`);
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error } = await supabase.from('depoimentos').insert({
      cliente_nome: validation.sanitized.cliente_nome,
      texto: validation.sanitized.texto,
      nota: validation.sanitized.nota,
    });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar depoimento' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Testimonial submitted successfully from IP: ${clientIp}`);
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
