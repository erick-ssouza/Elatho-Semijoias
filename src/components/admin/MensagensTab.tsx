import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, Trash2, Mail, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Mensagem {
  id: string;
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

interface MensagensTabProps {
  onUpdate: () => void;
}

const MensagensTab = ({ onUpdate }: MensagensTabProps) => {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMensagem, setSelectedMensagem] = useState<Mensagem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMensagens();
  }, []);

  const fetchMensagens = async () => {
    try {
      const { data, error } = await supabase
        .from("mensagens")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMensagens(data || []);
    } catch (error) {
      console.error("Error fetching mensagens:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("mensagens")
        .update({ lida: true })
        .eq("id", id);
      if (error) throw error;
      setMensagens((prev) =>
        prev.map((m) => (m.id === id ? { ...m, lida: true } : m))
      );
      onUpdate();
      toast({ title: "Mensagem marcada como lida!" });
    } catch (error) {
      toast({ title: "Erro ao atualizar mensagem", variant: "destructive" });
    }
  };

  const deleteMensagem = async (id: string) => {
    try {
      const { error } = await supabase.from("mensagens").delete().eq("id", id);
      if (error) throw error;
      setMensagens((prev) => prev.filter((m) => m.id !== id));
      onUpdate();
      toast({ title: "Mensagem excluída!" });
    } catch (error) {
      toast({ title: "Erro ao excluir mensagem", variant: "destructive" });
    }
  };

  const openMensagem = async (mensagem: Mensagem) => {
    setSelectedMensagem(mensagem);
    if (!mensagem.lida) {
      markAsRead(mensagem.id);
    }
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
        <CardTitle>Gerenciar Mensagens</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mensagens.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma mensagem encontrada
                  </TableCell>
                </TableRow>
              ) : (
                mensagens.map((mensagem) => (
                  <TableRow key={mensagem.id} className={!mensagem.lida ? "bg-primary/5" : ""}>
                    <TableCell>
                      {!mensagem.lida && (
                        <Badge variant="destructive" className="text-xs">
                          Nova
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className={!mensagem.lida ? "font-bold" : ""}>
                      {mensagem.nome}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`mailto:${mensagem.email}`}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Mail className="w-3 h-3" />
                        {mensagem.email}
                      </a>
                    </TableCell>
                    <TableCell className={!mensagem.lida ? "font-bold" : ""}>
                      {mensagem.assunto}
                    </TableCell>
                    <TableCell>
                      {format(new Date(mensagem.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => openMensagem(mensagem)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {!mensagem.lida && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => markAsRead(mensagem.id)}
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
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
                              <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMensagem(mensagem.id)}>
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

      {/* Message Detail Modal */}
      <Dialog open={!!selectedMensagem} onOpenChange={() => setSelectedMensagem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedMensagem?.assunto}</DialogTitle>
          </DialogHeader>
          {selectedMensagem && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  <strong>De:</strong> {selectedMensagem.nome} ({selectedMensagem.email})
                </div>
                <div>
                  {format(new Date(selectedMensagem.created_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg whitespace-pre-wrap">
                {selectedMensagem.mensagem}
              </div>
              <div className="flex justify-end">
                <Button asChild>
                  <a href={`mailto:${selectedMensagem.email}?subject=Re: ${selectedMensagem.assunto}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Responder por Email
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MensagensTab;
