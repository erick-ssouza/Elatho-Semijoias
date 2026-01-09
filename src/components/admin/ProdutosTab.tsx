import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Images, AlertCircle } from "lucide-react";
import MultiImageUpload from "./MultiImageUpload";
import { 
  TIPOS_MATERIAL, 
  gerarDescricaoAutomatica
} from "@/lib/productDescriptions";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  preco_promocional: number | null;
  categoria: string;
  imagem_url: string | null;
  imagens: string[] | null;
  estoque: number | null;
  destaque: boolean | null;
  variacoes: unknown;
  tipo_tamanho: string | null;
  faixa_tamanho: string | null;
  tamanhos_disponiveis: string[] | null;
  tipo_material: string | null;
}

const categorias = [
  { value: "aneis", label: "Anéis" },
  { value: "brincos", label: "Brincos" },
  { value: "colares", label: "Colares" },
  { value: "pulseiras", label: "Pulseiras" },
  { value: "conjuntos", label: "Conjuntos" },
];

const NUMERACOES = ["12", "14", "16", "18", "20", "22", "24", "26", "28", "30"];

const getCategoriaLabel = (value: string) => {
  const cat = categorias.find(c => c.value === value);
  return cat ? cat.label : value;
};

const ProdutosTab = () => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    nome: "",
    tipoMaterial: "",
    preco: "",
    preco_promocional: "",
    categoria: "",
    imagem_url: "",
    imagens: [] as string[],
    estoque: "10",
    destaque: false,
    // Ring size fields
    tipoTamanho: "" as "" | "unico" | "numeracao" | "pmg",
    faixaTamanho: "",
    tamanhosDisponiveis: [] as string[],
  });

  useEffect(() => {
    fetchProdutos();
  }, []);

  const fetchProdutos = async () => {
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Cast imagens to string array
      const produtosFormatted = (data || []).map(p => ({
        ...p,
        imagens: Array.isArray(p.imagens) ? p.imagens as string[] : null
      })) as Produto[];
      
      setProdutos(produtosFormatted);
    } catch (error) {
      console.error("Error fetching produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      nome: "",
      tipoMaterial: "",
      preco: "",
      preco_promocional: "",
      categoria: "",
      imagem_url: "",
      imagens: [],
      estoque: "10",
      destaque: false,
      tipoTamanho: "",
      faixaTamanho: "",
      tamanhosDisponiveis: [],
    });
    setEditingProduto(null);
  };

  const handleMaterialChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      tipoMaterial: value,
    }));
  };

  const handleCategoriaChange = (categoria: string) => {
    setForm(prev => ({
      ...prev,
      categoria,
      // Reset ring size fields when changing category
      tipoTamanho: categoria === 'aneis' ? prev.tipoTamanho : "",
      faixaTamanho: categoria === 'aneis' ? prev.faixaTamanho : "",
      tamanhosDisponiveis: categoria === 'aneis' ? prev.tamanhosDisponiveis : [],
    }));
  };

  const openEdit = (produto: Produto) => {
    setEditingProduto(produto);
    
    // Usar tipo_material salvo no banco (se existir)
    const tipoMaterial = produto.tipo_material || "";
    
    // Detectar tipo de tamanho para produtos antigos
    let tipoTamanho: "" | "unico" | "numeracao" | "pmg" = "";
    const savedTipoTamanho = produto.tipo_tamanho;
    if (savedTipoTamanho === "unico" || savedTipoTamanho === "numeracao" || savedTipoTamanho === "pmg") {
      tipoTamanho = savedTipoTamanho;
    }
    let tamanhosDisponiveis = Array.isArray(produto.tamanhos_disponiveis) ? produto.tamanhos_disponiveis : [];
    
    setForm({
      nome: produto.nome,
      tipoMaterial,
      preco: String(produto.preco),
      preco_promocional: produto.preco_promocional ? String(produto.preco_promocional) : "",
      categoria: produto.categoria,
      imagem_url: produto.imagem_url || "",
      imagens: Array.isArray(produto.imagens) ? produto.imagens : [],
      estoque: String(produto.estoque || 10),
      destaque: produto.destaque || false,
      tipoTamanho,
      faixaTamanho: produto.faixa_tamanho || "",
      tamanhosDisponiveis,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Garantir que categoria está em minúsculas sem acento
    const categoriaValue = form.categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Ring size fields - only for "aneis" category
    const isAnel = categoriaValue === 'aneis';

    const produtoData = {
      nome: form.nome,
      descricao: null, // Descrição é gerada dinamicamente no site
      tipo_material: form.tipoMaterial || null,
      preco: parseFloat(form.preco),
      preco_promocional: form.preco_promocional ? parseFloat(form.preco_promocional) : null,
      categoria: categoriaValue,
      imagem_url: form.imagem_url || null,
      imagens: form.imagens.length > 0 ? form.imagens : null,
      estoque: parseInt(form.estoque),
      destaque: form.destaque,
      variacoes: null, // Campo removido
      tipo_tamanho: isAnel && form.tipoTamanho ? form.tipoTamanho : null,
      faixa_tamanho: isAnel && form.tipoTamanho === 'unico' ? form.faixaTamanho || null : null,
      tamanhos_disponiveis: isAnel && (form.tipoTamanho === 'pmg' || form.tipoTamanho === 'numeracao') && form.tamanhosDisponiveis.length > 0 
        ? form.tamanhosDisponiveis 
        : null,
    };

    try {
      if (editingProduto) {
        const { error } = await supabase
          .from("produtos")
          .update(produtoData)
          .eq("id", editingProduto.id);
        if (error) throw error;
        toast({ title: "Produto atualizado!" });
      } else {
        const { error } = await supabase.from("produtos").insert(produtoData);
        if (error) throw error;
        toast({ title: "Produto criado!" });
      }

      fetchProdutos();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: "Erro ao salvar produto", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggleDestaque = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from("produtos")
        .update({ destaque: !currentValue })
        .eq("id", id);
      if (error) throw error;
      setProdutos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, destaque: !currentValue } : p))
      );
    } catch (error) {
      toast({ title: "Erro ao atualizar destaque", variant: "destructive" });
    }
  };

  const deleteProduto = async (id: string) => {
    try {
      const { error } = await supabase.from("produtos").delete().eq("id", id);
      if (error) throw error;
      setProdutos((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Produto excluído!" });
    } catch (error) {
      toast({ title: "Erro ao excluir produto", variant: "destructive" });
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gerenciar Produtos</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduto ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={form.categoria} onValueChange={handleCategoriaChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoMaterial">Tipo de Material</Label>
                <Select value={form.tipoMaterial} onValueChange={handleMaterialChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de material" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_MATERIAL.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview da descrição que será exibida no site */}
              {form.tipoMaterial && form.categoria && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Preview da descrição (gerado automaticamente no site)</Label>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto border">
                    {gerarDescricaoAutomatica(form.categoria, form.tipoMaterial)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="preco">Preço (R$) *</Label>
                  <Input
                    id="preco"
                    type="number"
                    step="0.01"
                    value={form.preco}
                    onChange={(e) => setForm({ ...form, preco: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preco_promocional">Preço Promocional</Label>
                  <Input
                    id="preco_promocional"
                    type="number"
                    step="0.01"
                    value={form.preco_promocional}
                    onChange={(e) => setForm({ ...form, preco_promocional: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estoque">Estoque</Label>
                  <Input
                    id="estoque"
                    type="number"
                    value={form.estoque}
                    onChange={(e) => setForm({ ...form, estoque: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Images className="w-4 h-4" />
                  Imagens do Produto (até 5)
                </Label>
                <MultiImageUpload
                  mainImage={form.imagem_url}
                  additionalImages={form.imagens}
                  onMainImageChange={(url) => setForm({ ...form, imagem_url: url })}
                  onAdditionalImagesChange={(urls) => setForm({ ...form, imagens: urls })}
                />
              </div>

              {/* Ring Size Options - Only show for Anéis category */}
              {form.categoria === 'aneis' && (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                  <Label className="text-sm font-medium">Tipo de Tamanho (Anéis)</Label>
                  
                  <RadioGroup
                    value={form.tipoTamanho}
                    onValueChange={(value) => setForm({ 
                      ...form, 
                      tipoTamanho: value as "" | "unico" | "numeracao" | "pmg",
                      // Reset dependent fields when changing type
                      faixaTamanho: "",
                      tamanhosDisponiveis: [],
                    })}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unico" id="tamanho-unico" />
                      <Label htmlFor="tamanho-unico" className="font-normal cursor-pointer">
                        Tamanho Único / Regulável
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="numeracao" id="tamanho-numeracao" />
                      <Label htmlFor="tamanho-numeracao" className="font-normal cursor-pointer">
                        Numeração (12-30)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pmg" id="tamanho-pmg" />
                      <Label htmlFor="tamanho-pmg" className="font-normal cursor-pointer">
                        Tamanhos P/M/G
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Options for Tamanho Único */}
                  {form.tipoTamanho === 'unico' && (
                    <div className="space-y-2 pl-6">
                      <Label htmlFor="faixaTamanho" className="text-sm">
                        Faixa de ajuste (opcional)
                      </Label>
                      <Input
                        id="faixaTamanho"
                        value={form.faixaTamanho}
                        onChange={(e) => setForm({ ...form, faixaTamanho: e.target.value })}
                        placeholder="Ex: Regulável 14-18"
                      />
                    </div>
                  )}

                  {/* Options for Numeração (12-30) */}
                  {form.tipoTamanho === 'numeracao' && (
                    <div className="space-y-3 pl-6">
                      <Label className="text-sm">Tamanhos disponíveis (marque os que têm estoque):</Label>
                      <div className="grid grid-cols-5 gap-2">
                        {NUMERACOES.map((num) => (
                          <div key={num} className="flex items-center space-x-2">
                            <Checkbox
                              id={`num-${num}`}
                              checked={form.tamanhosDisponiveis.includes(num)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setForm({ 
                                    ...form, 
                                    tamanhosDisponiveis: [...form.tamanhosDisponiveis, num].sort((a, b) => parseInt(a) - parseInt(b))
                                  });
                                } else {
                                  setForm({ 
                                    ...form, 
                                    tamanhosDisponiveis: form.tamanhosDisponiveis.filter(t => t !== num) 
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`num-${num}`} className="font-normal cursor-pointer text-sm">
                              {num}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {form.tamanhosDisponiveis.length === 0 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Selecione ao menos um tamanho disponível
                        </p>
                      )}
                    </div>
                  )}

                  {/* Options for P/M/G */}
                  {form.tipoTamanho === 'pmg' && (
                    <div className="space-y-3 pl-6">
                      <Label className="text-sm">Tamanhos disponíveis em estoque:</Label>
                      <div className="space-y-2">
                        {[
                          { id: 'P', label: 'P (Nº 12-14)' },
                          { id: 'M', label: 'M (Nº 16-18)' },
                          { id: 'G', label: 'G (Nº 20-22)' },
                        ].map((tamanho) => (
                          <div key={tamanho.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`tamanho-${tamanho.id}`}
                              checked={form.tamanhosDisponiveis.includes(tamanho.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setForm({ 
                                    ...form, 
                                    tamanhosDisponiveis: [...form.tamanhosDisponiveis, tamanho.id] 
                                  });
                                } else {
                                  setForm({ 
                                    ...form, 
                                    tamanhosDisponiveis: form.tamanhosDisponiveis.filter(t => t !== tamanho.id) 
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`tamanho-${tamanho.id}`} className="font-normal cursor-pointer">
                              {tamanho.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {form.tamanhosDisponiveis.length === 0 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Selecione ao menos um tamanho disponível
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="destaque"
                  checked={form.destaque}
                  onCheckedChange={(checked) => setForm({ ...form, destaque: checked })}
                />
                <Label htmlFor="destaque">Produto em destaque (aparece na home)</Label>
              </div>

              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingProduto ? "Salvar Alterações" : "Criar Produto"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagem</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum produto encontrado
                  </TableCell>
                </TableRow>
              ) : (
                produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <img
                        src={produto.imagem_url || "/placeholder.svg"}
                        alt={produto.nome}
                        className="w-12 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell>{getCategoriaLabel(produto.categoria)}</TableCell>
                    <TableCell>
                      {produto.preco_promocional ? (
                        <div>
                          <span className="line-through text-muted-foreground text-sm">
                            R$ {Number(produto.preco).toFixed(2)}
                          </span>
                          <br />
                          <span className="text-green-600 font-medium">
                            R$ {Number(produto.preco_promocional).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span>R$ {Number(produto.preco).toFixed(2)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{produto.estoque ?? 0}</span>
                        {(produto.estoque ?? 0) <= 0 && (
                          <Badge variant="destructive" className="text-[10px]">
                            Esgotado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={produto.destaque || false}
                        onCheckedChange={() => toggleDestaque(produto.id, produto.destaque || false)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEdit(produto)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteProduto(produto.id)}>
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

export default ProdutosTab;
