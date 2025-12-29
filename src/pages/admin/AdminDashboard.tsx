import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogOut, Package, ShoppingCart, Users, MessageSquare, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PedidosTab from "@/components/admin/PedidosTab";
import ProdutosTab from "@/components/admin/ProdutosTab";
import ClientesTab from "@/components/admin/ClientesTab";
import DepoimentosTab from "@/components/admin/DepoimentosTab";
import MensagensTab from "@/components/admin/MensagensTab";

interface Metrics {
  totalPedidos: number;
  pedidosPendentes: number;
  totalClientes: number;
  mensagensNaoLidas: number;
}

interface ChartData {
  status: string;
  quantidade: number;
}

const AdminDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics>({
    totalPedidos: 0,
    pedidosPendentes: 0,
    totalClientes: 0,
    mensagensNaoLidas: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/painel-elatho-2025");
    }
  }, [loading, user, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin]);

  const fetchMetrics = async () => {
    try {
      // Fetch all metrics in parallel
      const [pedidosRes, clientesRes, mensagensRes] = await Promise.all([
        supabase.from("pedidos").select("status"),
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase.from("mensagens").select("lida"),
      ]);

      const pedidos = pedidosRes.data || [];
      const totalClientes = clientesRes.count || 0;
      const mensagens = mensagensRes.data || [];

      // Calculate metrics
      const totalPedidos = pedidos.length;
      const pedidosPendentes = pedidos.filter((p) => p.status === "pendente").length;
      const mensagensNaoLidas = mensagens.filter((m) => !m.lida).length;

      setMetrics({
        totalPedidos,
        pedidosPendentes,
        totalClientes,
        mensagensNaoLidas,
      });

      // Calculate chart data
      const statusCount: Record<string, number> = {};
      pedidos.forEach((p) => {
        statusCount[p.status] = (statusCount[p.status] || 0) + 1;
      });

      const statusLabels: Record<string, string> = {
        pendente: "Pendente",
        confirmado: "Confirmado",
        enviado: "Enviado",
        entregue: "Entregue",
        cancelado: "Cancelado",
      };

      setChartData(
        Object.entries(statusCount).map(([status, quantidade]) => ({
          status: statusLabels[status] || status,
          quantidade,
        }))
      );
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold text-primary">
            Painel Elatho
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingMetrics ? <Loader2 className="w-4 h-4 animate-spin" /> : metrics.totalPedidos}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Pendentes</CardTitle>
              <Package className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {loadingMetrics ? <Loader2 className="w-4 h-4 animate-spin" /> : metrics.pedidosPendentes}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loadingMetrics ? <Loader2 className="w-4 h-4 animate-spin" /> : metrics.totalClientes}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mensagens Não Lidas</CardTitle>
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loadingMetrics ? <Loader2 className="w-4 h-4 animate-spin" /> : metrics.mensagensNaoLidas}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Pedidos por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pedidos" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="pedidos" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="produtos" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Produtos</span>
            </TabsTrigger>
            <TabsTrigger value="clientes" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Clientes</span>
            </TabsTrigger>
            <TabsTrigger value="depoimentos" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Depoimentos</span>
            </TabsTrigger>
            <TabsTrigger value="mensagens" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Mensagens</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos">
            <PedidosTab onUpdate={fetchMetrics} />
          </TabsContent>
          <TabsContent value="produtos">
            <ProdutosTab />
          </TabsContent>
          <TabsContent value="clientes">
            <ClientesTab />
          </TabsContent>
          <TabsContent value="depoimentos">
            <DepoimentosTab />
          </TabsContent>
          <TabsContent value="mensagens">
            <MensagensTab onUpdate={fetchMetrics} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
