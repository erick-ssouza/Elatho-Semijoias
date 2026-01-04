import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  reviews: Array<{
    id: string;
    cliente_email?: string;
  }>;
  produto_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { reviews, produto_id }: RequestBody = await req.json();

    if (!reviews || !produto_id) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing reviews or produto_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all emails from reviews that have cliente_email
    const reviewsWithEmail = reviews.filter(r => r.cliente_email);
    
    if (reviewsWithEmail.length === 0) {
      // No emails to check, return empty result
      return new Response(
        JSON.stringify({ success: true, verifiedIds: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all paid orders that contain this product
    const { data: pedidos, error } = await supabase
      .from("pedidos")
      .select("cliente_email, itens")
      .in("status", ["pago", "enviado", "entregue"]);

    if (error) {
      console.error("Error fetching pedidos:", error);
      throw error;
    }

    // Check which review emails have purchased this product
    const verifiedIds: string[] = [];
    
    for (const review of reviewsWithEmail) {
      const hasPurchased = pedidos?.some(pedido => {
        if (pedido.cliente_email?.toLowerCase() !== review.cliente_email?.toLowerCase()) {
          return false;
        }
        
        // Check if the order contains this product
        const itens = pedido.itens as Array<{ id: string }>;
        return itens?.some(item => item.id === produto_id);
      });

      if (hasPurchased) {
        verifiedIds.push(review.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, verifiedIds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("check-verified-purchase error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
