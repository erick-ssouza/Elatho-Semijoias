import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Trash2, Search, Mail, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Inscricao {
  id: string;
  email: string;
  ativo: boolean;
  created_at: string;
}

const NewsletterTab = () => {
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchInscricoes();
  }, []);

  const fetchInscricoes = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_inscricoes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInscricoes(data || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: "Erro ao carregar inscrições",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAtivo = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("newsletter_inscricoes")
        .update({ ativo: !currentValue })
        .eq("id", id);

      if (error) throw error;

      setInscricoes((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ativo: !currentValue } : i))
      );

      toast({
        title: !currentValue ? "Inscrição ativada" : "Inscrição desativada",
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        title: "Erro ao atualizar inscrição",
        variant: "destructive",
      });
    }
  };

  const deleteInscricao = async (id: string) => {
    try {
      const { error } = await supabase
        .from("newsletter_inscricoes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setInscricoes((prev) => prev.filter((i) => i.id !== id));
      toast({
        title: "Inscrição removida",
      });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        title: "Erro ao remover inscrição",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const activeInscricoes = inscricoes.filter((i) => i.ativo);
    const csv = activeInscricoes.map((i) => i.email).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-emails-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Emails exportados",
      description: `${activeInscricoes.length} emails ativos exportados.`,
    });
  };

  const filteredInscricoes = inscricoes.filter((i) =>
    i.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAtivos = inscricoes.filter((i) => i.ativo).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Inscrições na Newsletter
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {totalAtivos} inscritos ativos de {inscricoes.length} total
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredInscricoes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {searchTerm ? "Nenhum email encontrado." : "Nenhuma inscrição ainda."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Data de Inscrição</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInscricoes.map((inscricao) => (
                  <TableRow key={inscricao.id}>
                    <TableCell className="font-medium">{inscricao.email}</TableCell>
                    <TableCell>
                      {format(new Date(inscricao.created_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={inscricao.ativo}
                        onCheckedChange={() => toggleAtivo(inscricao.id, inscricao.ativo)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover inscrição?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover {inscricao.email} da newsletter? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteInscricao(inscricao.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NewsletterTab;
