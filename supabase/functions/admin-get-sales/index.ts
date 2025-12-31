import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function requireAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return { ok: false as const, status: 401, body: { success: false, error: "Unauthorized" } };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userRes, error: userErr } = await authClient.auth.getUser();
  if (userErr || !userRes?.user) {
    return { ok: false as const, status: 401, body: { success: false, error: "Unauthorized" } };
  }

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: role, error: roleErr } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userRes.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleErr || !role) {
    return { ok: false as const, status: 403, body: { success: false, error: "Forbidden" } };
  }

  return { ok: true as const, adminClient, userId: userRes.user.id };
}

interface Body {
  startDate?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = await requireAdmin(req);
    if (!admin.ok) {
      return new Response(JSON.stringify(admin.body), {
        status: admin.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: Body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const startDate = body?.startDate ? new Date(body.startDate) : null;

    let query = admin.adminClient
      .from("pedidos")
      .select("total, created_at, status")
      .neq("status", "cancelado")
      .order("created_at", { ascending: true });

    if (startDate && !Number.isNaN(startDate.getTime())) {
      query = query.gte("created_at", startDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, pedidos: data || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("admin-get-sales error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
