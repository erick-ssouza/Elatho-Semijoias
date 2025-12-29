import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Trash2, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Avaliacao {
  id: string;
  produto_id: string;
  cliente_nome: string;
  cliente_email: string;
  nota: number;
  titulo: string | null;
  comentario: string | null;
  aprovado: boolean;
  created_at: string;
  produtos?: { nome: string } | null;
}

const AvaliacoesTab = () => {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAvaliacoes();
  }, []);

  const fetchAvaliacoes = async () => {
    try {
      const { data, error } = await supabase
        .from("avaliacoes")
        .select("*, produtos(nome)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAvaliacoes(data || []);
    } catch (error) {
      console.error("Error fetching avaliacoes:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateAprovado = async (id: string, aprovado: boolean) => {
    try {
      const { error } = await supabase
        .from("avaliacoes")
        .update({ aprovado })
        .eq("id", id);

      if (error) throw error;

      setAvaliacoes((prev) =>
        prev.map((a) => (a.id === id ? { ...a, aprovado } : a))
      );
      toast({ title: aprovado ? "Avaliação aprovada!" : "Avaliação reprovada" });
    } catch (error) {
      toast({ title: "Erro ao atualizar avaliação", variant: "destructive" });
    }
  };

  const deleteAvaliacao = async (id: string) => {
    try {
      const { error } = await supabase.from("avaliacoes").delete().eq("id", id);
      if (error) throw error;

      setAvaliacoes((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Avaliação excluída!" });
    } catch (error) {
      toast({ title: "Erro ao excluir avaliação", variant: "destructive" });
    }
  };

  const renderStars = (nota: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= nota ? "fill-primary text-primary" : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Gerenciar Avaliações de Produtos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Nota</TableHead>
                <TableHead>Comentário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {avaliacoes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma avaliação recebida
                  </TableCell>
                </TableRow>
              ) : (
                avaliacoes.map((avaliacao) => (
                  <TableRow key={avaliacao.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {avaliacao.produtos?.nome || "Produto removido"}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{avaliacao.cliente_nome}</p>
                        <p className="text-xs text-muted-foreground">{avaliacao.cliente_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{renderStars(avaliacao.nota)}</TableCell>
                    <TableCell className="max-w-[200px]">
                      {avaliacao.titulo && (
                        <p className="font-medium text-sm">{avaliacao.titulo}</p>
                      )}
                      {avaliacao.comentario && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {avaliacao.comentario}
                        </p>
                      )}
                      {!avaliacao.titulo && !avaliacao.comentario && (
                        <span className="text-muted-foreground text-sm">Sem comentário</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          avaliacao.aprovado
                            ? "bg-green-100 text-green-800"
                            : "bg-amber-100 text-amber-800"
                        }
                      >
                        {avaliacao.aprovado ? "Aprovada" : "Pendente"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(avaliacao.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!avaliacao.aprovado && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateAprovado(avaliacao.id, true)}
                            title="Aprovar"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                        )}
                        {avaliacao.aprovado && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateAprovado(avaliacao.id, false)}
                            title="Desaprovar"
                          >
                            <X className="w-4 h-4 text-amber-600" />
                          </Button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir avaliação?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteAvaliacao(avaliacao.id)}>
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvaliacoesTab;
