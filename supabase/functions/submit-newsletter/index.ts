import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: 1 signup per 5 minutes per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_REQUESTS = 1;

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

function validateEmail(data: unknown): { valid: boolean; error?: string; email?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Dados inválidos' };
  }

  const input = data as Record<string, unknown>;

  if (!input.email || typeof input.email !== 'string') {
    return { valid: false, error: 'Email é obrigatório' };
  }

  const email = input.email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email inválido' };
  }

  if (email.length > 255) {
    return { valid: false, error: 'Email muito longo' };
  }

  return { valid: true, email };
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
        JSON.stringify({ error: 'Muitas tentativas. Aguarde alguns minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const validation = validateEmail(body);

    if (!validation.valid || !validation.email) {
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

    // Check if email already exists
    const { data: existing } = await supabase
      .from('newsletter_inscricoes')
      .select('id, ativo')
      .eq('email', validation.email)
      .maybeSingle();

    if (existing) {
      if (existing.ativo) {
        return new Response(
          JSON.stringify({ error: 'Este email já está inscrito!' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Reactivate subscription
        const { error } = await supabase
          .from('newsletter_inscricoes')
          .update({ ativo: true })
          .eq('id', existing.id);

        if (error) {
          console.error('Database error:', error);
          return new Response(
            JSON.stringify({ error: 'Erro ao reativar inscrição' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Newsletter reactivated for: ${validation.email}`);
        return new Response(
          JSON.stringify({ success: true, message: 'Inscrição reativada!' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const { error } = await supabase.from('newsletter_inscricoes').insert({
      email: validation.email,
      ativo: true,
    });

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar inscrição' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Newsletter signup from IP: ${clientIp}, email: ${validation.email}`);
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
