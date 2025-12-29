import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, LogOut, Package, ShoppingCart, Users, MessageSquare, Star, TrendingUp, Ticket } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";
import { format, subDays, subWeeks, subMonths, startOfDay, startOfWeek, startOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import PedidosTab from "@/components/admin/PedidosTab";
import ProdutosTab from "@/components/admin/ProdutosTab";
import ClientesTab from "@/components/admin/ClientesTab";
import DepoimentosTab from "@/components/admin/DepoimentosTab";
import MensagensTab from "@/components/admin/MensagensTab";
import CuponsTab from "@/components/admin/CuponsTab";

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

interface SalesData {
  periodo: string;
  vendas: number;
  pedidos: number;
}

type PeriodType = "7dias" | "4semanas" | "6meses";

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
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [period, setPeriod] = useState<PeriodType>("7dias");
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [totalVendas, setTotalVendas] = useState(0);

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

  useEffect(() => {
    if (isAdmin) {
      fetchSalesData();
    }
  }, [isAdmin, period]);

  const fetchMetrics = async () => {
    try {
      const [pedidosRes, clientesRes, mensagensRes] = await Promise.all([
        supabase.from("pedidos").select("status"),
        supabase.from("clientes").select("id", { count: "exact", head: true }),
        supabase.from("mensagens").select("lida"),
      ]);

      const pedidos = pedidosRes.data || [];
      const totalClientes = clientesRes.count || 0;
      const mensagens = mensagensRes.data || [];

      const totalPedidos = pedidos.length;
      const pedidosPendentes = pedidos.filter((p) => p.status === "pendente").length;
      const mensagensNaoLidas = mensagens.filter((m) => !m.lida).length;

      setMetrics({
        totalPedidos,
        pedidosPendentes,
        totalClientes,
        mensagensNaoLidas,
      });

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

  const fetchSalesData = async () => {
    try {
      let startDate: Date;
      let intervals: Date[];
      let formatStr: string;

      const now = new Date();

      switch (period) {
        case "7dias":
          startDate = subDays(now, 6);
          intervals = eachDayOfInterval({ start: startDate, end: now });
          formatStr = "dd/MM";
          break;
        case "4semanas":
          startDate = subWeeks(now, 3);
          intervals = eachWeekOfInterval({ start: startDate, end: now });
          formatStr = "'Sem' w";
          break;
        case "6meses":
          startDate = subMonths(now, 5);
          intervals = eachMonthOfInterval({ start: startDate, end: now });
          formatStr = "MMM";
          break;
        default:
          startDate = subDays(now, 6);
          intervals = eachDayOfInterval({ start: startDate, end: now });
          formatStr = "dd/MM";
      }

      const { data: pedidos, error } = await supabase
        .from("pedidos")
        .select("total, created_at, status")
        .gte("created_at", startDate.toISOString())
        .neq("status", "cancelado");

      if (error) throw error;

      const salesByPeriod: Record<string, { vendas: number; pedidos: number }> = {};

      intervals.forEach((date) => {
        const key = format(date, formatStr, { locale: ptBR });
        salesByPeriod[key] = { vendas: 0, pedidos: 0 };
      });

      (pedidos || []).forEach((pedido) => {
        const pedidoDate = new Date(pedido.created_at);
        let key: string;

        switch (period) {
          case "7dias":
            key = format(pedidoDate, "dd/MM", { locale: ptBR });
            break;
          case "4semanas":
            key = format(pedidoDate, "'Sem' w", { locale: ptBR });
            break;
          case "6meses":
            key = format(pedidoDate, "MMM", { locale: ptBR });
            break;
          default:
            key = format(pedidoDate, "dd/MM", { locale: ptBR });
        }

        if (salesByPeriod[key]) {
          salesByPeriod[key].vendas += Number(pedido.total);
          salesByPeriod[key].pedidos += 1;
        }
      });

      const formattedData: SalesData[] = intervals.map((date) => {
        const key = format(date, formatStr, { locale: ptBR });
        return {
          periodo: key,
          vendas: salesByPeriod[key]?.vendas || 0,
          pedidos: salesByPeriod[key]?.pedidos || 0,
        };
      });

      setSalesData(formattedData);
      setTotalVendas(formattedData.reduce((acc, curr) => acc + curr.vendas, 0));
    } catch (error) {
      console.error("Error fetching sales data:", error);
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

        {/* Sales Chart */}
        <Card className="mb-8">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Vendas por Período</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total no período</p>
                <p className="text-xl font-bold text-primary">
                  R$ {totalVendas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Select value={period} onValueChange={(value: PeriodType) => setPeriod(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="4semanas">Últimas 4 semanas</SelectItem>
                  <SelectItem value="6meses">Últimos 6 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="periodo" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => `R$${value}`} 
                    className="text-xs"
                    width={70}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Vendas"]}
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vendas" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorVendas)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Status Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pedidos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="status" className="text-xs" />
                      <YAxis allowDecimals={false} className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Orders Count Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Quantidade de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="periodo" className="text-xs" />
                    <YAxis allowDecimals={false} className="text-xs" />
                    <Tooltip 
                      formatter={(value: number) => [value, "Pedidos"]}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pedidos" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pedidos" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
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
            <TabsTrigger value="cupons" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Cupons</span>
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
          <TabsContent value="cupons">
            <CuponsTab />
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
