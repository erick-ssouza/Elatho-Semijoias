import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, LogOut, User, Mail, Edit2, Check, X } from 'lucide-react';

interface Pedido {
  id: string;
  numero_pedido: string;
  status: string;
  total: number;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  preparando: 'Em Preparação',
  enviado: 'Enviado',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pendente: 'bg-yellow-500/20 text-yellow-600',
  pago: 'bg-blue-500/20 text-blue-600',
  preparando: 'bg-purple-500/20 text-purple-600',
  enviado: 'bg-indigo-500/20 text-indigo-600',
  entregue: 'bg-green-500/20 text-green-600',
  cancelado: 'bg-red-500/20 text-red-600',
};

export default function MinhaConta() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  const currentName = user?.user_metadata?.nome || '';
  const currentEmail = user?.email || '';

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: '/minha-conta' } });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchPedidos = async () => {
      if (!user?.email) return;

      try {
        const { data, error } = await supabase
          .from('pedidos')
          .select('id, numero_pedido, status, total, created_at')
          .eq('cliente_email', user.email)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) throw error;
        setPedidos(data || []);
      } catch (error) {
        console.error('Error fetching pedidos:', error);
      } finally {
        setLoadingPedidos(false);
      }
    };

    if (user) {
      fetchPedidos();
    }
  }, [user]);

  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim() === currentName) {
      setEditingName(false);
      return;
    }

    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { nome: newName.trim() }
      });

      if (error) throw error;

      toast({ title: 'Nome atualizado com sucesso!' });
      setEditingName(false);
    } catch (error) {
      console.error('Error updating name:', error);
      toast({
        title: 'Erro ao atualizar nome',
        variant: 'destructive',
      });
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Você saiu da sua conta' });
    navigate('/');
  };

  const formatPrice = (value: number) => {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Minha Conta | Elatho Semijoias</title>
        <meta name="description" content="Gerencie sua conta Elatho, veja seus pedidos e atualize suas informações." />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Navbar />

      <main className="container mx-auto px-4 py-8 pt-28">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Minha Conta' },
          ]}
        />

        <div className="max-w-4xl mx-auto mt-8 space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-display text-gradient-gold mb-2">Minha Conta</h1>
            <p className="text-muted-foreground">Gerencie suas informações e acompanhe seus pedidos</p>
          </div>

          {/* User Info Card */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Meus Dados
              </CardTitle>
              <CardDescription>Suas informações pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome
                </Label>
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Seu nome"
                      className="input-elegant max-w-xs"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleSaveName}
                      disabled={savingName}
                    >
                      {savingName ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingName(false)}
                      disabled={savingName}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-foreground">{currentName || 'Não informado'}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setNewName(currentName);
                        setEditingName(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <span className="text-foreground">{currentEmail}</span>
              </div>

              <Separator />

              {/* Sign Out */}
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair da Conta
              </Button>
            </CardContent>
          </Card>

          {/* Recent Orders Card */}
          <Card className="card-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Pedidos Recentes
              </CardTitle>
              <CardDescription>Seus últimos 5 pedidos</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPedidos ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pedidos.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Você ainda não fez nenhum pedido</p>
                  <Button asChild className="btn-gold">
                    <Link to="/#produtos">Começar a Comprar</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pedidos.map((pedido) => (
                    <div
                      key={pedido.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">Pedido #{pedido.numero_pedido}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(pedido.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[pedido.status] || 'bg-muted text-muted-foreground'}`}>
                          {statusLabels[pedido.status] || pedido.status}
                        </span>
                        <span className="font-medium">{formatPrice(pedido.total)}</span>
                      </div>
                    </div>
                  ))}

                  <div className="pt-4">
                    <Button asChild variant="outline" className="w-full">
                      <Link to="/meus-pedidos">Ver Todos os Pedidos</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
