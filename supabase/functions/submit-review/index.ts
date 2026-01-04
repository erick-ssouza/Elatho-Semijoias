import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 3 reviews per hour per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
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

interface ReviewInput {
  produto_id: string;
  cliente_nome: string;
  cliente_email: string;
  nota: number;
  titulo?: string;
  comentario?: string;
}

function validateInput(data: unknown): { valid: boolean; error?: string; sanitized?: ReviewInput } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Dados inválidos' };
  }

  const input = data as Record<string, unknown>;

  // Validate produto_id (UUID format)
  if (!input.produto_id || typeof input.produto_id !== 'string') {
    return { valid: false, error: 'ID do produto é obrigatório' };
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(input.produto_id)) {
    return { valid: false, error: 'ID do produto inválido' };
  }

  // Validate cliente_nome
  if (!input.cliente_nome || typeof input.cliente_nome !== 'string') {
    return { valid: false, error: 'Nome é obrigatório' };
  }
  const nome = input.cliente_nome.trim();
  if (nome.length < 2 || nome.length > 100) {
    return { valid: false, error: 'Nome deve ter entre 2 e 100 caracteres' };
  }

  // Validate cliente_email
  if (!input.cliente_email || typeof input.cliente_email !== 'string') {
    return { valid: false, error: 'Email é obrigatório' };
  }
  const email = input.cliente_email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || email.length > 255) {
    return { valid: false, error: 'Email inválido' };
  }

  // Validate nota
  if (typeof input.nota !== 'number' || input.nota < 1 || input.nota > 5) {
    return { valid: false, error: 'Nota deve ser entre 1 e 5' };
  }

  // Validate titulo (optional)
  let titulo: string | undefined;
  if (input.titulo) {
    if (typeof input.titulo !== 'string') {
      return { valid: false, error: 'Título inválido' };
    }
    titulo = input.titulo.trim();
    if (titulo.length > 100) {
      return { valid: false, error: 'Título deve ter no máximo 100 caracteres' };
    }
    if (titulo.length === 0) titulo = undefined;
  }

  // Validate comentario (optional)
  let comentario: string | undefined;
  if (input.comentario) {
    if (typeof input.comentario !== 'string') {
      return { valid: false, error: 'Comentário inválido' };
    }
    comentario = input.comentario.trim();
    if (comentario.length > 1000) {
      return { valid: false, error: 'Comentário deve ter no máximo 1000 caracteres' };
    }
    if (comentario.length === 0) comentario = undefined;
  }

  return {
    valid: true,
    sanitized: {
      produto_id: input.produto_id,
      cliente_nome: nome,
      cliente_email: email,
      nota: Math.floor(input.nota),
      titulo,
      comentario,
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
        JSON.stringify({ error: 'Muitas tentativas. Aguarde 1 hora.' }),
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

    const { error } = await supabase.from('avaliacoes').insert({
      produto_id: validation.sanitized.produto_id,
      cliente_nome: validation.sanitized.cliente_nome,
      cliente_email: validation.sanitized.cliente_email,
      nota: validation.sanitized.nota,
      titulo: validation.sanitized.titulo || null,
      comentario: validation.sanitized.comentario || null,
    });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar avaliação' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Review submitted successfully from IP: ${clientIp}`);
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
